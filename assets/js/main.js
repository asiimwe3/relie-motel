document.addEventListener('DOMContentLoaded',function(){
 var all=Array.prototype.slice.call(document.querySelectorAll('.ggrid figure'));
 var shown=all;
 all.forEach(function(f,i){f.addEventListener('click',function(){openLb(all.indexOf(f))})});
 function openLb(i){
  var f=shown[i];if(!f)return;window._i=i;
  document.getElementById('lb-img').src=f.getAttribute('data-full');
  document.getElementById('lb-cap').textContent=f.getAttribute('data-cap');
  document.getElementById('lb').style.display='flex';
 }
 window.stepLb=function(d){if(!shown.length)return;openLb((window._i+d+shown.length)%shown.length)};
 document.querySelectorAll('.filters button').forEach(function(b){
  b.addEventListener('click',function(){
   document.querySelectorAll('.filters button').forEach(function(x){x.classList.remove('on')});
   b.classList.add('on');var c=b.getAttribute('data-c');shown=[];
   all.forEach(function(f){
    var ok=(c==='all'||f.getAttribute('data-cat')===c);
    f.style.display=ok?'':'none';
    if(ok)shown.push(f);
   });
  });
 });
 var lb=document.getElementById('lb');
 if(lb)lb.addEventListener('click',function(e){if(e.target===lb||e.target.className==='x')lb.style.display='none'});
 document.addEventListener('keydown',function(e){
  if(lb&&lb.style.display==='flex'){if(e.key==='Escape')lb.style.display='none';
  if(e.key==='ArrowRight')stepLb(1);if(e.key==='ArrowLeft')stepLb(-1)}
 });
});