document.addEventListener("DOMContentLoaded", () => {
  const preloader = document.getElementById("preloader");
  const header = document.getElementById("siteHeader");
  const menuToggle = document.getElementById("menuBtn");
  const mainNav = document.getElementById("mainNav");
  const navLinks = document.querySelectorAll("#mainNav a");

  const hidePreloader = () => {
    if (!preloader) return;
    preloader.classList.add("done");
    setTimeout(() => preloader.remove(), 350);
  };
  window.addEventListener("load", hidePreloader, { once:true });
  setTimeout(hidePreloader, 2500); // never leave the page blocked if a remote asset hangs

  const closeMenu = () => {
    mainNav?.classList.remove("open");
    menuToggle?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  };

  menuToggle?.addEventListener("click", () => {
    const open = !mainNav?.classList.contains("open");
    mainNav?.classList.toggle("open", open);
    menuToggle.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach(link => link.addEventListener("click", closeMenu));

  window.addEventListener("scroll", () => {
    header?.classList.toggle("scrolled", window.scrollY > 30);
    const hashLinks = [...navLinks].filter(a => (a.getAttribute("href") || "").startsWith("#"));
    const sections = [...document.querySelectorAll("main section[id]")];
    let current = "home";
    for (const section of sections) {
      if (window.scrollY >= section.offsetTop - 160) current = section.id;
    }
    hashLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === `#${current}`));
  }, { passive:true });
});

