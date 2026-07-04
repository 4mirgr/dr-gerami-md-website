const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
if(toggle&&nav){toggle.addEventListener('click',()=>nav.classList.toggle('open'));}
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',()=>nav?.classList.remove('open'));});
const year=document.getElementById('year'); if(year) year.textContent=new Date().getFullYear();
const sections=[...document.querySelectorAll('[data-section]')];
const menuLinks=[...document.querySelectorAll('.cabinet-menu a')];
if(sections.length){const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){menuLinks.forEach(l=>l.classList.toggle('active',l.getAttribute('href')==='#'+e.target.id));}});},{threshold:.35});sections.forEach(s=>obs.observe(s));}
