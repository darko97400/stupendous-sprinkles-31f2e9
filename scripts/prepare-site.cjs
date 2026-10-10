const fs=require('node:fs/promises');
const path=require('node:path');

// Publish web assets only. Function code, migrations, tests and environment files
// stay outside the public directory; Netlify packages functions separately.
async function prepare(root=process.cwd(),output=path.join(root,'site-dist')) {
  await fs.mkdir(output,{recursive:true});
  for(const item of await fs.readdir(root,{withFileTypes:true})) {
    if(item.isFile()&&(item.name==='_redirects'||/\.(html|css|js)$/i.test(item.name)))
      await fs.copyFile(path.join(root,item.name),path.join(output,item.name));
  }
  await fs.cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
}
module.exports={prepare};
if(require.main===module)prepare().catch(()=>{console.error('Static site preparation failed');process.exitCode=1;});
