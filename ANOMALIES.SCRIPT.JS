// Register GSAP plugins
gsap.registerPlugin(Observer);
Splitting(); // Initialize Splitting.js for character splitting

// Utility functions
const lerp = (a, b, n) => (1 - n) * a + n * b;
const getCursorPos = (ev) => ({ x: ev.clientX, y: ev.clientY });

// Define DOM elements
const DOM = {
  slides: [...document.querySelectorAll(".slide")],
  cursor: document.querySelector(".cursor"),
  backCtrl: document.querySelector(".frame__back"),
  cursorText: document.querySelector(".cursor__text"),
  navigationItems: document.querySelectorAll(".frame__nav > .frame__nav-button")
};

// Initial fade setup for back button and cursor text
gsap.set(DOM.backCtrl, { opacity: 0, display: 'none' });
gsap.set(DOM.cursorText, { opacity: 0, display: 'none' });

// Track cursor position
let cursor = { x: 0, y: 0 };
window.addEventListener("mousemove", (ev) => (cursor = getCursorPos(ev)));

// Slide management
class Slide {
  constructor(DOM_el) {
    this.DOM = {
      el: DOM_el,
      inner: DOM_el.querySelector(".slide__inner"),
      img: DOM_el.querySelector(".slide__img"),
      imgInner: DOM_el.querySelector(".slide__img-inner"),
      content: DOM_el.querySelector(".slide__content"),
      contentImg: DOM_el.querySelector(".slide__content-img"),
      contentTexts: [...DOM_el.querySelector(".slide__content").children].filter(
        (item) => item !== DOM_el.querySelector(".slide__content-img")
      )
    };
  }
}
let slidesArr = DOM.slides.map((slide) => new Slide(slide));

// Current slide position
let current = -1;
let isAnimating = false;

const setCurrentSlide = (position) => {
  if (current !== -1) {
    slidesArr[current].DOM.el.classList.remove("slide--current");
  }
  current = position;
  slidesArr[current].DOM.el.classList.add("slide--current");
  DOM.navigationItems[current].classList.add("frame__nav-button--current");
};

// Navigation functions
const next = () => {
  const newPosition = current < DOM.slides.length - 1 ? current + 1 : 0;
  navigate(newPosition);
};
const prev = () => {
  const newPosition = current > 0 ? current - 1 : DOM.slides.length - 1;
  navigate(newPosition);
};

// Slide navigation
const navigate = (newPosition) => {
  isAnimating = true;
  const currentSlide = slidesArr[current];
  const upcomingSlide = slidesArr[newPosition];
  current = newPosition;

  gsap.timeline({
    defaults: { duration: 1.6, ease: "power3.inOut" },
    onComplete: () => {
      currentSlide.DOM.el.classList.remove("slide--current");
      if (currentSlide.isOpen) hideContent(currentSlide);
      isAnimating = false;
    }
  })
    .set(
      [currentSlide.DOM.imgInner, upcomingSlide.DOM.imgInner],
      { transformOrigin: "50% 0%" },
      "start"
    )
    .set(upcomingSlide.DOM.el, { yPercent: 100 }, "start")
    .add(() => upcomingSlide.DOM.el.classList.add("slide--current"), "start")
    .to(
      currentSlide.DOM.el,
      { yPercent: -100 },
      "start"
    )
    .to(
      currentSlide.DOM.imgInner,
      { scaleY: 2 },
      "start"
    )
    .to(
      [upcomingSlide.DOM.el, upcomingSlide.DOM.inner],
      { yPercent: 0 },
      "start"
    )
    .to(
      upcomingSlide.DOM.imgInner,
      { scaleY: 1 },
      "start"
    );
};

// Fade-in and fade-out for back button and cursor text
const fadeInBackAndCursor = () => {
  gsap.timeline()
    .set([DOM.backCtrl, DOM.cursorText], { display: 'inline-block' })
    .to([DOM.backCtrl, DOM.cursorText], { opacity: 1, duration: 1 });
};
const fadeOutBackAndCursor = () => {
  return gsap.timeline()
    .to([DOM.backCtrl, DOM.cursorText], { opacity: 0, duration: 1 })
    .set([DOM.backCtrl, DOM.cursorText], { display: 'none' });
};

// Show and hide content functions
const showContent = (position) => {
  if (isAnimating) return;
  isAnimating = true;
  const slide = slidesArr[position];
  slide.isOpen = true;

  gsap.timeline({
    defaults: { duration: 1.6, ease: "power3.inOut" },
    onComplete: () => { isAnimating = false; }
  })
    .add(() => fadeInBackAndCursor())
    .to(
      slide.DOM.img,
      { yPercent: -100 },
      "start"
    )
    .to(
      slide.DOM.imgInner,
      { yPercent: 100, scaleY: 2 },
      "start"
    )
    .to(
      slide.DOM.contentImg,
      { scaleY: 1 },
      "start"
    );
};

const hideContent = (slide) => {
  gsap.timeline({
    defaults: { duration: 1.6, ease: "power3.inOut" },
    onComplete: () => {
      slide.isOpen = false;
      isAnimating = false;
    }
  })
    .add(() => fadeOutBackAndCursor())
    .to(slide.DOM.img, { yPercent: 0 })
    .to(slide.DOM.imgInner, { yPercent: 0, scaleY: 1 });
};

// Event handlers
DOM.slides.forEach((slide, index) => {
  slide.addEventListener("click", () => showContent(index));
});
DOM.backCtrl.addEventListener("click", async () => {
  if (isAnimating) return;
  isAnimating = true;
  await fadeOutBackAndCursor();
  hideContent(slidesArr[current]);
});

// Initialize events
const initEvents = () => {
  DOM.navigationItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      if (current === index || isAnimating) return;
      navigate(index);
    });
  });
  Observer.create({
    type: "wheel,touch,pointer",
    onDown: () => !isAnimating && prev(),
    onUp: () => !isAnimating && next(),
    wheelSpeed: -1,
    tolerance: 10
  });
};
initEvents();
setCurrentSlide(0);
