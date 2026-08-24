const CLOUD_NAME='jkia38fa';
const UPLOAD_PRESET='khobragade_csc';
export async function uploadCloudFile(file,folder='kcsc-portal/uploads'){
  if(!file)throw new Error('File required');
  const fd=new FormData();fd.append('file',file);fd.append('upload_preset',UPLOAD_PRESET);fd.append('folder',folder);
  const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,{method:'POST',body:fd});
  const j=await r.json().catch(()=>({}));if(!r.ok||!j.secure_url)throw new Error(j.error?.message||'File upload failed');
  return j.secure_url;
}
