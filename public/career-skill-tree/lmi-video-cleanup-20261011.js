(() => {
  const $=s=>document.querySelector(s);

  function directCareerOneStopVideo(code){
    const soc=String(code||'').trim();
    if(!/^\d{2}-\d{4}$/.test(soc))return '';
    return `https://cdn.careeronestop.org/OccVids/OccupationVideos/${soc}.00.mp4`;
  }

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

      const direct=directCareerOneStopVideo(code);
      if(direct){
        link.href=direct;
        link.textContent='▶ Watch CareerOneStop occupation video ↗';
        link.title=`Watch the CareerOneStop video for ${title||'this occupation'}`;
        link.dataset.directVideo='1';
      }else{
        link.href=exactCareerOneStopProfile(code,title);
        link.textContent='▶ Open CareerOneStop occupation profile ↗';
        link.title=`Open the CareerOneStop occupation profile for ${title||'this occupation'}`;
        link.dataset.directVideo='0';
      }
    });

    host.querySelectorAll('.career-video-status').forEach(status=>{
      const link=host.querySelector('[data-career-video]');
      if(link?.dataset.directVideo==='1'){
        if(/optional/i.test(status.textContent||''))status.textContent='Opens the CareerOneStop video for this occupation.';
      }else if(/optional/i.test(status.textContent||'')){
        status.textContent='A direct CareerOneStop video was not resolved; the occupation profile is available instead.';
      }
    });
  }

  function install(){
    cleanWorkspace();
    const body=document.body;
    if(!body||body.dataset.lmiVideoCleanup==='2')return;
    body.dataset.lmiVideoCleanup='2';
    const observer=new MutationObserver(()=>queueMicrotask(cleanWorkspace));
    observer.observe(body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();