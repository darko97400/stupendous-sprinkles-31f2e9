const {execFile}=require('node:child_process');
const {promisify}=require('node:util');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const run=promisify(execFile);
const MAX_BYTES=250000;
async function limitedBody(response, max=MAX_BYTES) {
  if (!response.ok) throw new Error('upstream');
  const parts=[]; let size=0;
  for await (const chunk of response.body) { size+=chunk.length; if(size>max) throw new Error('size'); parts.push(Buffer.from(chunk)); }
  return Buffer.concat(parts);
}
// Metadata-free CBR MPEG-1 Layer III, mono 44.1 kHz at 96 kbps.
function validMp3(data) {
  if(!Buffer.isBuffer(data)||data.length<4||data.length>MAX_BYTES)return false;
  let at=0,frames=0;
  while(at+4<=data.length) {
    if(data[at]!==255||(data[at+1]&254)!==250||(data[at+2]&252)!==112||(data[at+3]&192)!==192)return false;
    const size=313+((data[at+2]>>1)&1);
    if(size>data.length-at)return false;
    at+=size;frames++;
  }
  const seconds=frames*1152/44100;
  return at===data.length&&seconds>=.1&&seconds<=20.1;
}
async function processAudio(input, kind, ffmpeg=require('ffmpeg-static')) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ps-voice-'));
  try {
    const source=path.join(dir,'source.mp3'), target=path.join(dir,'voice.mp3');
    await fs.writeFile(source,input);
    const trim='silenceremove=start_periods=1:start_duration=0.015:start_threshold=-50dB:start_silence=0.04';
    let filter=trim+',areverse,'+trim+',areverse';
    filter+=kind==='training' ? ',atempo=1.06,highpass=f=65,loudnorm=I=-18:TP=-2.5:LRA=7' :
      ',asetrate=49392,aresample=44100,atempo=0.959821,highpass=f=90,lowpass=f=11000,aeval=val(0)*(0.91+0.09*cos(2*PI*103*t)),loudnorm=I=-17:TP=-2:LRA=7';
    await run(ffmpeg,['-v','error','-nostdin','-i',source,'-af',filter,'-t','21','-ac','1','-ar','44100','-c:a','libmp3lame','-b:a','96k','-map_metadata','-1','-id3v2_version','0','-write_id3v1','0','-write_xing','0',target],{timeout:8000,windowsHide:true,maxBuffer:64000});
    const data=await fs.readFile(target); if(!validMp3(data))throw new Error('audio'); return data;
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
}
async function synthesize(j, key) {
  const response=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+j.voice+'?output_format=mp3_44100_128',{
    method:'POST',headers:{'xi-api-key':key,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000),
    body:JSON.stringify({text:j.prompt,model_id:j.model,language_code:j.language,voice_settings:j.settings})
  });
  return processAudio(await limitedBody(response,900000),j.kind);
}
module.exports={MAX_BYTES,validMp3,limitedBody,processAudio,synthesize};
