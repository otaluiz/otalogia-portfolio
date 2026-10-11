const menu = document.querySelector('.menu');
const nav = document.querySelector('nav');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.textContent='Menu +';menu.setAttribute('aria-label','Abrir menu')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Fechar −':'Menu +';menu.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
const projects=[...document.querySelectorAll('.project')];
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));projects.forEach(p=>{p.hidden=button.dataset.filter!=='all'&&p.dataset.category!==button.dataset.filter})}));
const modal=document.querySelector('dialog');
projects.forEach(project=>project.addEventListener('click',()=>{document.querySelector('#modal-title').textContent=project.dataset.title;document.querySelector('#modal-description').textContent=project.dataset.description;document.querySelector('#modal-art').replaceChildren(project.querySelector('.project-art').cloneNode(true));document.body.classList.add('modal-open');modal.showModal()}));
modal.querySelector('.close').addEventListener('click',()=>modal.close());
modal.addEventListener('close',()=>document.body.classList.remove('modal-open'));
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close()}});
document.querySelector('#year').textContent=new Date().getFullYear();
let scheduled=false;const progress=document.querySelector('.progress');function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?scrollY/max*100:0)+'%';scheduled=false}addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(updateProgress)}},{passive:true});addEventListener('resize',updateProgress);updateProgress();
