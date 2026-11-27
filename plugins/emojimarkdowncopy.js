(function(){
if(window.__ypEmojiMdInstalled)return;
window.__ypEmojiMdInstalled=true;

let pressedEl=null,pressTimer=null;

function find_emoji(el){
	let cur=el;
	while(cur&&cur!==document.body){
		if(cur.tagName==='IMG'&&cur.src&&cur.src.includes('files.yapper.website/emojis/'))return cur;
		if(cur.tagName==='BUTTON'&&cur.classList.contains('emoji-cell')&&!cur.classList.contains('std')){
			const img=cur.querySelector('img[src*="files.yapper.website/emojis/"]');
			if(img)return img;
		}
		cur=cur.parentElement;
	}
	return null;
}

function get_markdown(img){
	const src=img.src||'';
	const m=src.match(/emojis\/([0-9a-f-]{36})\//);
	const id=m?m[1]:null;
	if(!id)return null;
	const name=(img.alt||'').replace(/^:+|:+$/g,'')||'emoji';
	return '<:'+name+':'+id+'>';
}

function start_press(el){
	const md=get_markdown(el);
	if(!md)return;
	pressTimer=setTimeout(()=>{
		pressTimer=null;
		pressedEl=null;
		navigator.clipboard.writeText(md).then(()=>{
			const old=document.getElementById('yp-emoji-copy-popup');
			if(old)old.remove();
			const popup=document.createElement('div');
			popup.id='yp-emoji-copy-popup';
			popup.textContent='Yipee you copied le emoji markdown yay';
			popup.style.cssText='position:fixed;bottom:40px;right:40px;padding:12px 18px;background:#1a1a1a;color:#fff;border:1px solid #444;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.4);font-size:13px;z-index:999999;opacity:0;transform:translateY(20px) scale(0.9);transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;user-select:none;';
			document.body.appendChild(popup);
			requestAnimationFrame(()=>{
				popup.style.opacity='1';
				popup.style.transform='translateY(0) scale(1)';
			});
			setTimeout(()=>{
				popup.style.opacity='0';
				popup.style.transform='translateY(20px) scale(0.9)';
				setTimeout(()=>popup.remove(),200);
			},600);
		}).catch(()=>{});
	},1500);
}

function cancel_press(){
	if(pressTimer){clearTimeout(pressTimer);pressTimer=null;}
	pressedEl=null;
}

document.addEventListener('pointerdown',function(e){
	const emoji=find_emoji(e.target);
	if(emoji){pressedEl=emoji;start_press(emoji);}
},{passive:true});
document.addEventListener('pointerup',function(){cancel_press();},{passive:true});
document.addEventListener('pointerleave',function(e){
	const emoji=find_emoji(e.target);
	if(emoji&&emoji===pressedEl)cancel_press();
},{passive:true});
document.addEventListener('pointercancel',function(){cancel_press();},{passive:true});

window.PluginHost.register({
	id:'emoji-markdown-copy',
	name:'Copy emoji markdown',
	description:`Have YOU ever wanted to put emojis in webhooks but they sadly dont support :angry: for example? Well THIS PLUGIN SOLVES THAT! Just press and hold an emoji for 1.5 seconds and it copies the emoji's makdown!`,
	start:function(){},
	stop:function(){},
},true);
})()
