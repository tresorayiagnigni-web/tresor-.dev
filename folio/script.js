// ========== Progress Bars Animation ==========
const progressBars = document.querySelectorAll('.progress-fill');

const animateProgress = () => {
  progressBars.forEach(bar => {
    const width = bar.getAttribute('data-width');
    bar.style.width = width;
  });
};

// Observer pour lancer l'animation quand la section Skills est visible
const skillsSection = document.querySelector('#skills');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateProgress();
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

if (skillsSection) {
  observer.observe(skillsSection);
}

// ========== Active Navigation ==========
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach(section => {
    const sectionTop = section.offsetTop - 120;
    if (pageYOffset >= sectionTop) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// ========== Smooth Scroll ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});