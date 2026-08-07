const $=id=>document.getElementById(id);
let resultUrl=null;

$("garment").addEventListener("change",()=>{
  const file=$("garment").files[0];
  if(!file)return;
  $("fileLabel").textContent=file.name;
  $("preview").src=URL.createObjectURL(file);
$("preview").classList.remove("preview-hidden");
});

$("generate").addEventListener("click",async()=>{
  const file=$("garment").files[0];
  if(!file){alert("Upload a clothing photo first.");return;}

  const form=new FormData();
  form.append("garment",file);
  ["model","background","pose","style","extra"].forEach(id=>form.append(id,$(id).value));

  $("generate").disabled=true;
  $("download").disabled=true;
  $("status").textContent="● Generating…";
  $("canvas").innerHTML='<div><div class="spinner"></div><p>Creating your fashion campaign…</p></div>';

  try{
    const response=await fetch("/api/generate",{method:"POST",body:form});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Generation failed.");
    resultUrl=data.image;
    $("canvas").innerHTML=`<img src="${resultUrl}" alt="Generated OBITREND fashion image">`;
    $("download").disabled=false;
    $("status").textContent="● Image ready";
  }catch(error){
    $("canvas").innerHTML=`<div><h3>Generation failed</h3><p>${escapeHtml(error.message)}</p></div>`;
    $("status").textContent="● Error";
  }finally{$("generate").disabled=false;}
});

$("download").addEventListener("click",()=>{
  if(!resultUrl)return;
  const a=document.createElement("a");
  a.href=resultUrl;a.download="obitrend-fashion-campaign.png";a.click();
});

function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
