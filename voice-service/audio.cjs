const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const run=promisify(execFile);
const MAX_BYTES=900000;
async function limitedBody(response, max=MAX_BYTES) {
  if (!response.ok) throw new Error('upstream');
  const parts=[]; let size=0;
  for await (const chunk of response.body) { size+=chunk.length; if(size>max) throw new Error('size'); parts.push(Buffer.from(chunk)); }
  return Buffer.concat(parts);
}
function validWav(data) {
  if(!Buffer.isBuffer(data)||data.length<48||data.length>MAX_BYTES||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WAVE')return false;
  let fmt=false, samples=0;
  for(let offset=12;offset+8<=data.length;) {
    const kind=data.toString('ascii',offset,offset+4), size=data.readUInt32LE(offset+4), start=offset+8;
    if(start+size>data.length)return false;
    if(kind==='fmt ')fmt=size>=16&&data.readUInt16LE(start)===1&&data.readUInt16LE(start+2)===1&&data.readUInt32LE(start+4)===22050&&data.readUInt16LE(start+14)===16;
    if(kind==='data')samples+=size;
    offset=start+size+(size%2);
  }
  return fmt && samples>=4410 && samples<=882000;
}
async function processAudio(input, kind, ffmpeg=require('ffmpeg-static')) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ps-voice-'));
  try {
    const source=path.join(dir,'source.mp3'), target=path.join(dir,'voice.wav');
    await fs.writeFile(source,input);
    const trim='silenceremove=start_periods=1:start_duration=0.015:start_threshold=-50dB:start_silence=0.04';
    let filter=trim+',areverse,'+trim+',areverse';
    filter+=kind==='training' ? ',atempo=1.06,highpass=f=65,loudnorm=I=-18:TP=-2.5:LRA=7' :
      ',asetrate=49392,aresample=44100,atempo=0.959821,highpass=f=90,lowpass=f=11000,aeval=val(0)*(0.91+0.09*cos(2*PI*103*t)),loudnorm=I=-17:TP=-2:LRA=7';
    await run(ffmpeg,['-v','error','-nostdin','-i',source,'-af',filter,'-t','21','-ac','1','-ar','22050','-c:a','pcm_s16le',target],{timeout:8000,windowsHide:true,maxBuffer:64000});
    const data=await fs.readFile(target); if(!validWav(data))throw new Error('audio'); return data;
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
}
async function synthesize(j, key) {
  const response=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+j.voice+'?output_format=mp3_44100_128',{
    method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000),
    body:JSON.stringify({text:j.prompt,model_id:j.model,language_code:j.language,voice_settings:j.settings})
  });
  return processAudio(await limitedBody(response),j.kind);
}
module.exports={MAX_BYTES,validWav,limitedBody,processAudio,synthesize};
