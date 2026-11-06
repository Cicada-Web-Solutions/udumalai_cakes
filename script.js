/* Cozy Oven — scroll choreography and small tactile interactions. */
(() => {
  "use strict";

  const flavours = [
    {
      name: "Blueberry",
      bg: "#B4AEDE",
      accent: "#5F51B8",
      dark: "#1C173A",
      image: "assets/blueberry_cake.png",
      title: "Blueberry Dreams",
      text: "Soft layers, berry glaze, and handcrafted details made for celebrations that feel special."
    },
    {
      name: "Butterscotch",
      bg: "#EFCD98",
      accent: "#FFA647",
      dark: "#342409",
      image: "assets/butterscotch_cake.png",
      title: "Golden Crunch",
      text: "Creamy caramel tones, crisp shards, and a rich finish for moments that deserve glow."
    },
    {
      name: "Chocolate",
      bg: "#BF9788",
      accent: "#9F6956",
      dark: "#0D0907",
      image: "assets/chocolate_cake.png",
      title: "Chocolate Drama",
      text: "Deep cocoa, glossy ganache, and bold textures for pure dessert theatre."
    },
    {
      name: "Strawberry",
      bg: "#FBDCDB",
      accent: "#F1827E",
      dark: "#5C0D0A",
      image: "assets/strawberry_cake.png",
      title: "Berry Soft",
      text: "Fresh strawberry notes, silky frosting, and a bright playful finish for every celebration."
    }
  ];

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  // Manual word wrapping gives us the feel of SplitText without a paid plugin.
  document.querySelectorAll(".hero-title").forEach((title) => {
    title.innerHTML = title.innerHTML
      .split(/(<br>)/i)
      .map((part) => part.toLowerCase() === "<br>" ? part : part.trim().split(/\s+/).filter(Boolean).map((word) => `<span class="word"><span class="word-inner">${word}</span></span>`).join(" "))
      .join("");
  });

  const about = document.querySelector(".about-statement");
  about.innerHTML = about.textContent.trim().split(/\s+/).map((word) => `<span class="word">${word}</span>`).join(" ");

  // Order details are composed locally, then handed to WhatsApp for the
  // customer to review and send. Add the bakery number to data-whatsapp-number
  // on <body> to route messages directly to one account.
  const orderDialog = document.getElementById("order-form");
  const orderForm = orderDialog.querySelector(".order-form");
  const orderTriggers = document.querySelectorAll("[data-order-open]");
  const orderClose = orderDialog.querySelector("[data-order-close]");
  const formProgress = orderDialog.querySelector(".form-progress");
  const formProgressOutput = formProgress.querySelector("output");
  const dateInput = orderForm.elements.date;
  let lastOrderTrigger = null;

  const today = new Date();
  dateInput.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");

  const progressFields = Array.from(orderForm.elements).filter((field) => field.name && field.type !== "submit");
  const updateFormProgress = () => {
    const completed = progressFields.filter((field) => String(field.value).trim().length > 0).length;
    const percentage = Math.round((completed / progressFields.length) * 100);
    formProgress.style.setProperty("--form-progress", `${percentage}%`);
    formProgress.setAttribute("aria-valuenow", percentage);
    formProgressOutput.value = `${percentage}%`;
  };

  orderForm.addEventListener("input", updateFormProgress);
  orderForm.addEventListener("change", updateFormProgress);
  updateFormProgress();

  const closeOrderDialog = () => {
    if (orderDialog.open) orderDialog.close();
    lastOrderTrigger?.focus();
  };

  orderTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      lastOrderTrigger = trigger;
      if (typeof orderDialog.showModal === "function") orderDialog.showModal();
      else orderDialog.setAttribute("open", "");
      orderForm.elements.name.focus();
    });
  });

  orderClose.addEventListener("click", closeOrderDialog);
  orderDialog.addEventListener("click", (event) => {
    if (event.target === orderDialog) closeOrderDialog();
  });

  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!orderForm.reportValidity()) return;

    const data = new FormData(orderForm);
    const details = [
      "Hello Cozy Oven! I would like to place an order.",
      "",
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `Celebration date: ${data.get("date")}`,
      `Occasion: ${data.get("occasion") || "Not specified"}`,
      `Order type: ${data.get("cakeType")}`,
      `Flavour: ${data.get("flavour") || "Open to suggestions"}`,
      `Size / servings: ${data.get("size") || "To be discussed"}`,
      `Fulfilment: ${data.get("fulfilment")}`,
      `Design and other details: ${data.get("details")}`
    ].join("\n");
    const number = (document.body.dataset.whatsappNumber || "916385334119").replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${number}?text=${encodeURIComponent(details)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    closeOrderDialog();
  });

  // Keep the page fully usable if the animation CDN is unavailable.
  if (!window.gsap || !window.ScrollTrigger || reducedMotion) {
    document.documentElement.classList.add("no-gsap");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });

  const hero = document.querySelector(".hero");
  const cakeFrames = gsap.utils.toArray(".cake-frame");
  const cakeImages = cakeFrames.map((frame) => frame.querySelector("img"));
  const copyFrames = gsap.utils.toArray(".flavour-copy");
  const progressFill = document.querySelector(".progress-track span");
  const progressCount = document.querySelector(".progress-count");
  const progressName = document.querySelector(".progress-name");
  let currentFlavour = 0;

  // Pin the opening product stage and blend each flavour's complete colour system.
  const heroTimeline = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: () => `+=${window.innerHeight * 3.4}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Follow the visible copy rather than a coarse scroll percentage so the
        // label always names the cake currently taking visual priority.
        const timelineTime = self.animation ? self.animation.time() : self.progress * 6;
        const index = Math.min(3, Math.max(0, Math.ceil((timelineTime - .3) / 2)));
        const progress = 0.25 + self.progress * 0.75;
        gsap.set(progressFill, window.innerWidth < 768 ? { scaleX: progress } : { scaleY: progress });
        if (index !== currentFlavour) {
          currentFlavour = index;
          progressCount.textContent = `0${index + 1}`;
          progressName.textContent = flavours[index].name;
          document.querySelector('meta[name="theme-color"]').setAttribute("content", flavours[index].bg);
          cakeFrames.forEach((frame, i) => frame.setAttribute("aria-hidden", i === index ? "false" : "true"));
          copyFrames.forEach((frame, i) => frame.setAttribute("aria-hidden", i === index ? "false" : "true"));
        }
      }
    }
  });

  flavours.slice(1).forEach((flavour, i) => {
    const previous = i;
    const next = i + 1;
    const at = i * 2;
    const currentWords = copyFrames[previous].querySelectorAll(".word-inner");
    const nextWords = copyFrames[next].querySelectorAll(".word-inner");

    heroTimeline
      .to(hero, { "--hero-bg": flavour.bg, "--hero-accent": flavour.accent, "--hero-dark": flavour.dark, duration: 1.6, ease: "none" }, at)
      .to(cakeFrames[previous], { opacity: 0, duration: .75 }, at)
      .to(cakeImages[previous], { yPercent: 8, scale: .96, opacity: .45, duration: .8 }, at)
      .fromTo(cakeFrames[next], { opacity: 0 }, { opacity: 1, duration: .9 }, at + .08)
      .fromTo(cakeImages[next], { yPercent: -8, scale: 1.04, opacity: .45 }, { yPercent: 0, scale: 1, opacity: 1, duration: 1.05 }, at + .08)
      .to(currentWords, { yPercent: 110, opacity: 0, stagger: .035, duration: .48 }, at)
      .to(copyFrames[previous].querySelector("p"), { y: 18, opacity: 0, duration: .4 }, at)
      .set(copyFrames[previous], { opacity: 0 }, at + .52)
      .set(copyFrames[next], { opacity: 1 }, at)
      .fromTo(nextWords, { yPercent: -110, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: .045, duration: .65 }, at + .12)
      .fromTo(copyFrames[next].querySelector("p"), { y: -16, opacity: 0 }, { y: 0, opacity: 1, duration: .65 }, at + .22);
  });

  // The brownie and cookie share the same invisible wheel and counter-rotate upright.
  const dessertCopies = gsap.utils.toArray(".dessert-copy");
  const orbitTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: ".dessert-orbit",
      start: "top top",
      end: () => `+=${window.innerHeight * 1.3}`,
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  orbitTimeline
    .to(".dessert-orbit", { backgroundColor: "#e7ddd6", duration: 1.2, ease: "power2.inOut" }, 0)
    .to(".brownie-item", { "--angle": "180deg", opacity: 0, duration: 1.2, ease: "power2.inOut" }, 0)
    .to(".cookie-item", { "--angle": "90deg", opacity: 1, duration: 1.2, ease: "power2.inOut" }, 0)
    .to(dessertCopies[0], { y: 30, opacity: 0, duration: .45 }, .15)
    .set(dessertCopies[1], { opacity: 1 }, .38)
    .fromTo(dessertCopies[1], { y: -30 }, { y: 0, duration: .65 }, .38)
    .to(".doodle-one", { rotation: 100, y: 50, duration: 1.2 }, 0)
    .to(".doodle-two", { rotation: -75, y: -40, duration: 1.2 }, 0);

  // Word-by-word studio statement reveal.
  gsap.to(".about-statement .word", {
    color: "#ffffff",
    stagger: .08,
    ease: "none",
    scrollTrigger: {
      trigger: ".about",
      start: "top 65%",
      end: "bottom 65%",
      scrub: .7
    }
  });

  gsap.utils.toArray(".crumbs i").forEach((crumb, i) => {
    gsap.to(crumb, {
      y: i % 2 ? -110 : 130,
      rotation: i % 2 ? 120 : -140,
      ease: "none",
      scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: 1 }
    });
  });

  // Let the category rail drift with the page while remaining touch-scrollable.
  gsap.fromTo(".carousel-track", { x: 0 }, {
    x: () => Math.min(-260, window.innerWidth * -.18),
    ease: "none",
    scrollTrigger: { trigger: ".showcase", start: "top bottom", end: "bottom top", scrub: 1, invalidateOnRefresh: true }
  });

  gsap.from(".showcase-heading > *", {
    y: 70,
    opacity: 0,
    stagger: .15,
    duration: 1,
    scrollTrigger: { trigger: ".showcase-heading", start: "top 78%" }
  });

  gsap.fromTo(".showcase-card", {
    y: 110,
    autoAlpha: 0,
    scale: .9,
    rotationY: 12
  }, {
    y: 0,
    autoAlpha: 1,
    scale: 1,
    rotationY: 0,
    stagger: .13,
    duration: 1.05,
    ease: "power3.out",
    clearProps: "transform,opacity,visibility",
    scrollTrigger: { trigger: ".carousel-wrap", start: "top 84%" }
  });

  gsap.from(".showcase-card .card-image img", {
    scale: 1.18,
    filter: "blur(8px)",
    stagger: .12,
    duration: 1.15,
    ease: "power2.out",
    clearProps: "filter",
    scrollTrigger: { trigger: ".carousel-wrap", start: "top 82%" }
  });

  // Reveal the real cake cleanly, then keep it breathing very gently.
  gsap.timeline({ scrollTrigger: { trigger: ".cake-diagram", start: "top 76%" } })
    .fromTo(".cake-product-image", { clipPath: "inset(100% 0 0 0)", y: 65, scale: .94 }, { clipPath: "inset(0% 0 0 0)", y: 0, scale: 1, duration: 1.25, ease: "power3.out" })
    .from(".cake-ingredient-strip > *", { y: 12, opacity: 0, stagger: .08, duration: .5, ease: "power2.out" }, .72)
    .from(".cake-ground", { scaleX: .45, opacity: 0, duration: .7 }, .35);

  gsap.to(".cake-product-image", { y: -12, rotation: .6, duration: 3.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".anatomy-notes article", {
    x: 0,
    opacity: 1,
    stagger: .16,
    duration: .75,
    scrollTrigger: { trigger: ".anatomy-notes", start: "top 75%" }
  });

  gsap.to(".orb-a", { x: 110, y: 70, rotation: 45, ease: "none", scrollTrigger: { trigger: ".order", start: "top bottom", end: "bottom top", scrub: 1 } });
  gsap.to(".orb-b", { x: -90, y: -60, rotation: -35, ease: "none", scrollTrigger: { trigger: ".order", start: "top bottom", end: "bottom top", scrub: 1 } });

  // Gentle 3D tilt lives only on precise pointers so touch remains predictable.
  if (window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const rx = ((event.clientY - rect.top) / rect.height - .5) * -10;
        const ry = ((event.clientX - rect.left) / rect.width - .5) * 10;
        gsap.to(card, { rotationX: rx, rotationY: ry, z: 18, duration: .45, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => gsap.to(card, { rotationX: 0, rotationY: 0, z: 0, duration: .75, ease: "elastic.out(1,.5)" }));
    });

    const cursor = document.querySelector(".cursor");
    const cursorLabel = cursor.querySelector("span");
    window.addEventListener("mousemove", (event) => {
      gsap.to(cursor, { x: event.clientX, y: event.clientY, opacity: 1, duration: .18, ease: "power2.out" });
    });
    document.querySelectorAll("[data-cursor]").forEach((target) => {
      target.addEventListener("mouseenter", () => {
        cursorLabel.textContent = target.dataset.cursor;
        cursor.classList.add("is-big");
      });
      target.addEventListener("mouseleave", () => cursor.classList.remove("is-big"));
    });
    document.querySelectorAll("a").forEach((link) => {
      link.addEventListener("mouseenter", () => gsap.to(cursor, { scale: .55, duration: .2 }));
      link.addEventListener("mouseleave", () => gsap.to(cursor, { scale: 1, duration: .2 }));
    });
  }

  // Small magnetic pull, capped so the buttons always remain easy to click.
  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * .15, y: (event.clientY - rect.top - rect.height / 2) * .18, duration: .35 });
    });
    button.addEventListener("mouseleave", () => gsap.to(button, { x: 0, y: 0, duration: .65, ease: "elastic.out(1,.45)" }));
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
