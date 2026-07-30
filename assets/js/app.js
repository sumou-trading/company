const state = {
  language: localStorage.getItem("sumou-language") || "ar",
  translations: {}
};

const html = document.documentElement;
const languageToggle = document.getElementById("language-toggle");
const languageLabel = document.getElementById("language-label");
const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");
const scrollTopButton = document.getElementById("scroll-top");

async function loadTranslations(language) {
  if (state.translations[language]) {
    return state.translations[language];
  }

  const response = await fetch(`./locales/${language}/translation.json`);

  if (!response.ok) {
    throw new Error(`Unable to load ${language} translations`);
  }

  const messages = await response.json();
  state.translations[language] = messages;
  return messages;
}

async function applyLanguage(language) {
  const messages = await loadTranslations(language);

  state.language = language;
  localStorage.setItem("sumou-language", language);
  html.lang = language;
  html.dir = language === "ar" ? "rtl" : "ltr";
  languageLabel.textContent = language === "ar" ? "EN" : "AR";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    element.textContent = messages[key] || key;
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const key = element.dataset.i18nAria;
    element.setAttribute("aria-label", messages[key] || key);
  });

  document.title = language === "ar"
    ? "شركة السمو المتحدة التجارية | Al-Sumou Al-Mutahida Trading Co."
    : "Al-Sumou Al-Mutahida Trading Co. | Riyadh, Saudi Arabia";
}

function closeMobileMenu() {
  menuToggle.classList.remove("is-open");
  mobileMenu.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

function updateScrollInterface() {
  const scrollPosition = window.scrollY;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? scrollPosition / scrollableHeight : 0;

  document.getElementById("site-header").classList.toggle("is-scrolled", scrollPosition > 30);
  scrollTopButton.classList.toggle("is-visible", scrollPosition > Math.min(520, window.innerHeight * 0.65));
  scrollTopButton.style.setProperty("--scroll-progress", `${progress * 360}deg`);
}

function initialiseNavigation() {
  menuToggle.setAttribute("aria-expanded", "false");

  menuToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  languageToggle.addEventListener("click", async () => {
    await applyLanguage(state.language === "ar" ? "en" : "ar");
    closeMobileMenu();
  });

  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  window.addEventListener("scroll", updateScrollInterface, { passive: true });
  window.addEventListener("resize", updateScrollInterface, { passive: true });
  updateScrollInterface();
}

function revealElements() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll("[data-reveal], .portal-section").forEach((element) => {
    element.classList.add("reveal-ready");
    observer.observe(element);
  });

  document.querySelectorAll(".hero [data-reveal]").forEach((element, index) => {
    window.setTimeout(() => element.classList.add("is-visible"), 240 + index * 120);
  });
}

function initialiseMagneticButtons() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }

  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.16;
      button.style.transform = `translate(${x}px, ${y}px)`;
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translate(0, 0)";
    });
  });
}

function initialisePortal() {
  const canvas = document.getElementById("portal-canvas");
  const context = canvas.getContext("2d");
  const particles = [];
  const rings = [];
  let width = window.innerWidth;
  let height = window.innerHeight;
  let pointerX = 0;
  let pointerY = 0;
  let scrollOffset = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function seed() {
    particles.length = 0;
    rings.length = 0;

    const particleCount = width < 480 ? 90 : width < 900 ? 150 : 260;
    const ringCount = width < 480 ? 6 : 9;

    for (let index = 0; index < particleCount; index += 1) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 90 + Math.random() * Math.max(width, height) * 0.72,
        depth: 0.25 + Math.random() * 0.9,
        size: 0.5 + Math.random() * 1.7,
        speed: 0.0003 + Math.random() * 0.0012,
        hue: Math.random() > 0.8 ? 42 : Math.random() > 0.5 ? 188 : 258
      });
    }

    for (let index = 0; index < ringCount; index += 1) {
      rings.push({
        radius: 88 + index * 25,
        tilt: index * 0.06,
        opacity: 0.34 - index * 0.025,
        speed: 0.0004 + index * 0.00006
      });
    }
  }

  function draw(timestamp) {
    context.clearRect(0, 0, width, height);
    const centreX = width / 2 + pointerX * 28;
    const centreY = height / 2 + pointerY * 22 - scrollOffset * 0.03;

    context.save();
    context.globalCompositeOperation = "lighter";

    rings.forEach((ring, index) => {
      const pulse = Math.sin(timestamp * 0.001 + index) * 5;
      context.beginPath();
      context.ellipse(
        centreX,
        centreY,
        ring.radius + pulse,
        (ring.radius + pulse) * (0.56 + ring.tilt),
        timestamp * ring.speed + index * 0.15,
        0,
        Math.PI * 2
      );
      context.strokeStyle = `rgba(${index % 3 === 0 ? "128, 242, 255" : index % 3 === 1 ? "165, 140, 255" : "242, 199, 109"}, ${ring.opacity})`;
      context.lineWidth = 1;
      context.stroke();
    });

    particles.forEach((particle) => {
      particle.angle += particle.speed;
      const x = centreX + Math.cos(particle.angle) * particle.radius * particle.depth;
      const y = centreY + Math.sin(particle.angle) * particle.radius * 0.5 * particle.depth;
      const alpha = 0.18 + particle.depth * 0.45;
      context.beginPath();
      context.arc(x, y, particle.size * particle.depth, 0, Math.PI * 2);
      context.fillStyle = `hsla(${particle.hue}, 95%, 72%, ${alpha})`;
      context.fill();
    });

    context.restore();
    requestAnimationFrame(draw);
  }

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX / width - 0.5;
    pointerY = event.clientY / height - 0.5;
  }, { passive: true });

  window.addEventListener("scroll", () => {
    scrollOffset = window.scrollY;
  }, { passive: true });

  window.addEventListener("resize", () => {
    resize();
    seed();
  }, { passive: true });

  resize();
  seed();
  requestAnimationFrame(draw);
}

function initialiseForm() {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton.querySelector('[data-i18n="formSubmit"]');
    const translations = state.translations[state.language];

    document.getElementById("form-language").value = state.language === "ar" ? "Arabic" : "English";
    document.getElementById("form-page").value = window.location.href;
    document.getElementById("form-submitted-at").value = new Date().toLocaleString();

    submitButton.disabled = true;
    submitLabel.textContent = translations.formSending;
    formStatus.textContent = translations.formSending;
    formStatus.classList.remove("is-error");
    formStatus.classList.add("is-visible");

    try {
      const response = await fetch("https://formsubmit.co/ajax/united.sumou.info@gmail.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(contactForm)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Form submission failed");
      }

      contactForm.reset();
      formStatus.textContent = translations.formSuccess;
    } catch (error) {
      console.error("Contact form submission failed:", error);
      formStatus.textContent = translations.formError;
      formStatus.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitLabel.textContent = translations.formSubmit;
    }
  });
}

async function initialiseWebsite() {
  try {
    await Promise.all([loadTranslations("ar"), loadTranslations("en")]);
    await applyLanguage(state.language);
  } catch {
    state.language = "ar";
  }

  initialiseNavigation();
  revealElements();
  initialiseMagneticButtons();
  initialisePortal();
  initialiseForm();
}

initialiseWebsite();
