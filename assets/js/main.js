// hero slideshow
(function(){
 var slides=document.querySelectorAll('.slide');if(!slides.length)return;requestAnimationFrame(function(){setTimeout(function(){var hv=document.querySelector('.hero');if(hv)hv.classList.add('sw')},0)});
 var i=0,timer;
 function ready(im){return !im||(!im.dataset.src&&im.complete&&im.naturalWidth>1)}
 function warm(n){var im=slides[(n+slides.length)%slides.length].querySelector('img');if(im&&im.dataset.src){im.loading='eager';im.decoding='async';im.src=im.dataset.src;delete im.dataset.src}return im}
 function show(n){var t=(n+slides.length)%slides.length,im=warm(t);if(!ready(im)){warm(t+1);return false}slides[i].classList.remove('on');i=t;slides[i].classList.add('on');warm(i+1);return true}
 (window.requestIdleCallback||function(f){setTimeout(f,1500)})(function(){var k=1;(function step(){if(k>=slides.length)return;warm(k);k++;setTimeout(step,700)})()});
 function next(){show(i+1)}
 timer=setInterval(next,6000);
 document.querySelectorAll('.arrows button').forEach(function(b){
  b.addEventListener('click',function(){clearInterval(timer);show(this.dataset.d==='1'?i+1:i-1);timer=setInterval(next,6000)});
 });
})();
// booking mask -> WhatsApp
(function(){
 var b=document.getElementById('bookBtn');if(!b)return;
 b.addEventListener('click',function(){
  var ci=document.getElementById('ci').value||'flexible dates';
  var co=document.getElementById('co').value||'flexible dates';
  var g=document.getElementById('gs').value;
  var msg="Hello Relie Motel! I'd like to book: Check-in "+ci+", Check-out "+co+", "+g+". Please confirm availability and best rate.";
  window.open("https://wa.me/256775193137?text="+encodeURIComponent(msg),'_blank');
 });
})();