(()=>{
  function normalizedOnetCode(raw){
    const code=decodeURIComponent(String(raw||'')).trim();
    if(/^\d{2}-\d{4}\.\d{2}$/.test(code))return code;
    if(/^\d{2}-\d{4}$/.test(code))return `${code}.00`;
    return code;
  }

  function fixAnchor(anchor){
    if(!(anchor instanceof HTMLAnchorElement))return;
    let url;
    try{url=new URL(anchor.href,location.href)}catch{return}
    if(url.hostname!=='www.onetonline.org')return;
    const match=url.pathname.match(/^\/link\/summary\/([^/]+)$/);
    if(!match)return;
    const normalized=normalizedOnetCode(match[1]);
    if(normalized!==decodeURIComponent(match[1])){
      url.pathname=`/link/summary/${encodeURIComponent(normalized)}`;
      anchor.href=url.toString();
    }
  }

  function scan(root=document){
    root.querySelectorAll?.('a[href*="onetonline.org/link/summary/"]').forEach(fixAnchor);
  }

  scan();
  new MutationObserver(records=>{
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType!==1)return;
      if(node.matches?.('a[href*="onetonline.org/link/summary/"]'))fixAnchor(node);
      scan(node);
    }));
  }).observe(document.documentElement,{childList:true,subtree:true});

  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[href*="onetonline.org/link/summary/"]');
    if(anchor)fixAnchor(anchor);
  },true);
})();