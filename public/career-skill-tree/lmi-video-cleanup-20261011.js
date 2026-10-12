(() => {
  const $=s=>document.querySelector(s);

  function exactCareerOneStopProfile(code,title){
    const onet=String(code||'').replace(/\D/g,'')+'00';
    const params=new URLSearchParams({keyword:title||code||'',lang:'en',location:'US',onetcode:onet});
    return `https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?${params.toString()}`;
  }

  function cleanWorkspace(){
    const host=$('#careerLmiLab');
    if(!host)return;

    const badge=host.querySelector('.career-data-badge');
    const metrics=host.querySelector('.career-data-metrics');
    if(badge&&metrics&&!metrics.querySelector('[data-employment-metric]')){
      const text=(badge.textContent||'').trim();
      const value=text.replace(/\s*local jobs\s*$/i,'')||'Not available';
      const metric=document.createElement('div');
      metric.dataset.employmentMetric='1';
      metric.innerHTML=`<small>Local employment</small><strong>${value}</strong>`;
      metrics.insertAdjacentElement('afterbegin',metric);
      badge.remove();
    }else if(badge){
      badge.remove();
    }

    host.querySelectorAll('[data-career-video]').forEach(link=>{
      const code=link.dataset.careerVideo||'';
      const card=link.closest('.career-data-card');
      const title=card?.querySelector('.career-data-head h2')?.textContent?.trim()||'';
      if(!code)return;
      link.href=exactCareerOneStopProfile(code,title);
      link.textContent='▶ Watch occupation video ↗';
      link.title=`Open the CareerOneStop profile and video for ${title||'this occupation'}`;
    });

    host.querySelectorAll('.career-video-status').forEach(status=>{
      if(/optional/i.test(status.textContent||''))status.textContent='Opens the CareerOneStop page for this occupation, where the career video appears when available.';
    });
  }

  function install(){
    cleanWorkspace();
    const body=document.body;
    if(!body||body.dataset.lmiVideoCleanup==='1')return;
    body.dataset.lmiVideoCleanup='1';
    const observer=new MutationObserver(()=>queueMicrotask(cleanWorkspace));
    observer.observe(body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();