"use client";

export function ThemeInit() {
  // Inject a small inline script to set theme before paint
  const code = `
  (function(){
    try{
      var stored = localStorage.getItem('theme');
      var theme = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark');
      var el = document.documentElement;
      if(theme === 'dark') el.classList.add('dark'); else el.classList.remove('dark');
      el.setAttribute('data-theme', theme);
    }catch(e){}
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
