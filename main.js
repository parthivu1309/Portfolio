document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Navbar Scroll Effect ---
  const navbar = document.getElementById('navbar');
  const handleScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  
  // Initial check and event listener
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // --- 2. Mobile Menu Toggle ---
  const menuBtn = document.getElementById('menuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  const toggleMenu = () => {
    mobileDrawer.classList.toggle('open');
    // Prevent background scrolling when menu is open
    document.body.style.overflow = mobileDrawer.classList.contains('open') ? 'hidden' : '';
  };

  menuBtn.addEventListener('click', toggleMenu);
  
  // Close menu when a link is clicked
  drawerLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (mobileDrawer.classList.contains('open')) {
        toggleMenu();
      }
    });
  });

  // --- 3. Scroll Reveals ---
  // Apply staggered delays to child elements within same container if needed,
  // but for now simple intersection observer on .reveal elements
  const revealElements = document.querySelectorAll('.reveal');
  
  // Create observer
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optional: stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -10% 0px', // Trigger slightly before it comes into view
    threshold: 0.1
  });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // --- 4. Active Nav Link Highlighting ---
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links .nav-item');

  const highlightNav = () => {
    let scrollY = window.scrollY;
    
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      // Add a small offset so it triggers right when the section hits the upper third
      const sectionTop = current.offsetTop - 150;
      const sectionId = current.getAttribute('id');
      
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navItems.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav(); // Initial call

  // --- 5. CP Heatmap Generation ---
  // Create a 14x7 grid of divs for visual effect
  const heatmapGrid = document.getElementById('heatmapGrid');
  if (heatmapGrid) {
    const totalCells = 14 * 7;
    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.classList.add('heatmap-cell');
      
      // 25-35% filled squares, concentrated towards the right side.
      const progress = i / totalCells; // 0.0 to 1.0
      const prob = 0.1 + (progress * 0.35); // 10% on left, 45% on right
      
      const rand = Math.random();
      let level = 0;
      if (rand < prob) {
        const intensityRand = Math.random();
        if (intensityRand > 0.85) level = 4;
        else if (intensityRand > 0.65) level = 3;
        else if (intensityRand > 0.4) level = 2;
        else level = 1;
      }
      
      if (level > 0) {
        cell.setAttribute('data-level', level);
      }
      
      heatmapGrid.appendChild(cell);
    }
  }
});
