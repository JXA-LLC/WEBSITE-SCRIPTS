gsap.registerPlugin(Observer);
Splitting();

const lerp = (a, b, n) => (1 - n) * a + n * b;

const getCursorPos = (ev) => {
  return {
    x: ev.clientX,
    y: ev.clientY
  };
};

// Class representing a Slide element (.slide)
class Slide {
  DOM = {
    el: null,
    inner: null,
    img: null,
    imgInner: null,
    content: null,
    contentImg: null,
    contentTexts: null
  };

  constructor(DOM_el) {
    this.DOM.el = DOM_el;
    this.DOM.inner = this.DOM.el.querySelector(".slide__inner");
    this.DOM.img = this.DOM.el.querySelector(".slide__img");
    this.DOM.imgInner = this.DOM.el.querySelector(".slide__img-inner");
    this.DOM.content = this.DOM.el.querySelector(".slide__content");
    this.DOM.contentImg = this.DOM.content.querySelector(".slide__content-img");
    this.DOM.contentTexts = [...this.DOM.content.children].filter(
      (item) => item != this.DOM.contentImg
    );
  }
}

// Track the cursor position
let cursor = { x: 0, y: 0 };
window.addEventListener("mousemove", (ev) => (cursor = getCursorPos(ev)));

class CursorText {
  DOM = {
    el: null,
    text: null
  };
  renderedStyles = {
    tx: { previous: 0, current: 0, amt: 0.15 },
    ty: { previous: 0, current: 0, amt: 0.15 }
  };
  bounds;

  constructor(DOM_el) {
    this.DOM.el = DOM_el;
    this.DOM.text = this.DOM.el.querySelector(".cursor__text");
    this.DOM.el.style.opacity = 0;
    this.bounds = this.DOM.el.getBoundingClientRect();

    const onMouseMoveEv = () => {
      this.renderedStyles.tx.previous = this.renderedStyles.tx.current = cursor.x + 20;
      this.renderedStyles.ty.previous = this.renderedStyles.ty.current = cursor.y - this.bounds.height / 2;
      this.DOM.el.style.opacity = 1;
      requestAnimationFrame(() => this.render());
      window.removeEventListener("mousemove", onMouseMoveEv);
    };
    window.addEventListener("mousemove", onMouseMoveEv);
  }

  render() {
    this.renderedStyles["tx"].current = cursor.x + 20;
    this.renderedStyles["ty"].current = cursor.y - this.bounds.height / 2;

    for (const key in this.renderedStyles) {
      this.renderedStyles[key].previous = lerp(
        this.renderedStyles[key].previous,
        this.renderedStyles[key].current,
        this.renderedStyles[key].amt
      );
    }
    this.DOM.el.style.transform = `translateX(${this.renderedStyles["tx"].previous}px) translateY(${this.renderedStyles["ty"].previous}px)`;
    requestAnimationFrame(() => this.render());
  }
}

const DOM = {
  slides: [...document.querySelectorAll(".slide")],
  cursor: document.querySelector(".cursor"),
  backCtrl: document.querySelector(".frame__back"),
  navigationItems: document.querySelectorAll(".frame__nav > .frame__nav-button")
};

DOM.cursorChars = DOM.cursor.querySelectorAll(".word > .char, .whitespace");
DOM.backChars = DOM.backCtrl.querySelectorAll(".word > .char, .whitespace");

const totalSlides = DOM.slides.length;
let slidesArr = [];
DOM.slides.forEach((slide) => {
  slidesArr.push(new Slide(slide));
});

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

const navigate = (newPosition) => {
  isAnimating = true;
  DOM.navigationItems[current].classList.remove("frame__nav-button--current");
  DOM.navigationItems[newPosition].classList.add("frame__nav-button--current");

  const direction = current < newPosition ? "next" : "prev";
  const currentSlide = slidesArr[current];
  current = newPosition;
  const upcomingSlide = slidesArr[current];

  gsap.timeline({
    defaults: { duration: 1.6, ease: "power3.inOut" },
    onComplete: () => { currentSlide.DOM.el.classList.remove("slide--current"); isAnimating = false; }
  })
    .addLabel("start", 0)
    .set([currentSlide.DOM.imgInner, upcomingSlide.DOM.imgInner], { transformOrigin: direction === "next" ? "50% 0%" : "50% 100%" }, "start")
    .set(upcomingSlide.DOM.el, { yPercent: direction === "next" ? 100 : -100 }, "start")
    .set(upcomingSlide.DOM.inner, { yPercent: direction === "next" ? -100 : 100 }, "start")
    .add(() => { upcomingSlide.DOM.el.classList.add("slide--current"); }, "start")
    .to(currentSlide.DOM.el, { yPercent: direction === "next" ? -100 : 100 }, "start")
    .to(currentSlide.DOM.imgInner, { scaleY: 2 }, "start")
    .to([upcomingSlide.DOM.el, upcomingSlide.DOM.inner], { yPercent: 0 }, "start")
    .to(upcomingSlide.DOM.imgInner, { ease: "power2.inOut", startAt: { scaleY: 2 }, scaleY: 1 }, "start");
};

const toggleCursorBackTexts = (isContent) => {
  return gsap.timeline()
    .set(DOM.backChars, { opacity: isContent ? 0 : 1 })
    .to(DOM.backChars, { opacity: isContent ? 1 : 0, duration: 0.5 })
    .to(DOM.cursorChars, { opacity: isContent ? 0 : 1, duration: 0.5 }, 0);
};

const showContent = (position) => {
  if (isAnimating) return;
  isAnimating = true;

  const slide = slidesArr[position];
  slide.isOpen = true;

  gsap.timeline({
    defaults: { duration: 1.6, ease: "power3.inOut" },
    onComplete: () => { isAnimating = false; }
  })
    .add(() => toggleCursorBackTexts(true))
    .to(slide.DOM.img, { yPercent: -100 })
    .to(slide.DOM.imgInner, { yPercent: 100, scaleY: 2 })
    .to(slide.DOM.contentImg, { scaleY: 1 });
};

const hideContent = (slide) => {
  isAnimating = true;
  gsap.timeline({
    defaults: { duration: 1.6, ease: "power3.inOut" },
    onComplete: () => { slide.isOpen = false; isAnimating = false; }
  })
    .add(() => toggleCursorBackTexts(false))
    .to(slide.DOM.img, { yPercent: 0 })
    .to(slide.DOM.imgInner, { yPercent: 0, scaleY: 1 });
};

DOM.slides.forEach((slide, index) => {
  slide.addEventListener("click", () => showContent(index));
});

DOM.backCtrl.addEventListener("click", () => {
  if (isAnimating) return;
  isAnimating = true;
  hideContent(slidesArr[current]);
});

const initEvents = () => {
  [...DOM.navigationItems].forEach((item, position) => {
    item.addEventListener("click", () => {
      if (current === position || isAnimating) return;
      navigate(position);
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

setCurrentSlide(0);
new CursorText(DOM.cursor);
initEvents();
