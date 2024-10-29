gsap.registerPlugin(Observer);

const lerp = (a, b, n) => (1 - n) * a + n * b;

const getCursorPos = (ev) => {
  return {
    x: ev.clientX,
    y: ev.clientY
  };
};

// Class representing a Slide element (.slide)
class Slide {
  // DOM elements
  DOM = {
    // main element (.slide)
    el: null,
    // slide inner element (.slide__inner)
    inner: null,
    // slide image element (.slide__img)
    img: null,
    // slide image inner element (.slide__img-inner)
    imgInner: null,
    // slide content element (.slide__content)
    content: null,
    // slide content image (slide__content-img)
    contentImg: null,
    // other content elements besides the image
    contentTexts: null
  };

  // main element (.slide)
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

// Class representing a .cursor element
class CursorText {
  // DOM elements
  DOM = {
    // Main element (.cursor)
    el: null,
    // Inner element (.cursor__text)
    text: null
  };
  // Element style properties
  renderedStyles = {
    // With interpolation, we can achieve a smooth animation effect when moving the cursor.
    // The "previous" and "current" values are the values that will interpolate.
    // The returned value will be one between these two (previous and current) at a specific increment.
    // The "amt" is the amount to interpolate.
    // As an example, the following formula calculates the x-axis translation value to apply to the cursor element:
    // this.renderedStyles.tx.previous = lerp(this.renderedStyles.tx.previous, this.renderedStyles.tx.current, this.renderedStyles.tx.amt);

    // translation values
    // The lower the amt, the slower the cursor "follows" the user gesture
    tx: { previous: 0, current: 0, amt: 0.15 },
    ty: { previous: 0, current: 0, amt: 0.15 }
  };
  // Element size and position
  bounds;

  constructor(DOM_el) {
    this.DOM.el = DOM_el;
    this.DOM.text = this.DOM.el.querySelector(".cursor__text");

    // Hide it initially
    this.DOM.el.style.opacity = 0;

    // Calculate size and position
    this.bounds = this.DOM.el.getBoundingClientRect();

    for (const key in this.renderedStyles) {
      this.renderedStyles[key].amt =
        this.DOM.el.dataset.amt || this.renderedStyles[key].amt;
    }

    // Show the element and start tracking its position as soon as the user moves the cursor.
    const onMouseMoveEv = () => {
      // Set up the initial values to be the same
      this.renderedStyles.tx.previous = this.renderedStyles.tx.current =
        cursor.x + 20;
      this.renderedStyles.ty.previous = this.renderedStyles.ty.previous =
        cursor.y - this.bounds.height / 2;
      // Show it
      this.DOM.el.style.opacity = 1;
      // Start rAF loop
      requestAnimationFrame(() => this.render());
      // Remove the initial mousemove event
      window.removeEventListener("mousemove", onMouseMoveEv);
    };
    window.addEventListener("mousemove", onMouseMoveEv);
  }

  // Loop / Interpolation
  render() {
    // New cursor positions
    this.renderedStyles["tx"].current = cursor.x + 20;
    this.renderedStyles["ty"].current = cursor.y - this.bounds.height / 2;

    // Interpolation
    for (const key in this.renderedStyles) {
      this.renderedStyles[key].previous = lerp(
        this.renderedStyles[key].previous,
        this.renderedStyles[key].current,
        this.renderedStyles[key].amt
      );
    }

    // Apply interpolated values (smooth effect)
    this.DOM.el.style.transform = `translateX(${this.renderedStyles["tx"].previous}px) translateY(${this.renderedStyles["ty"].previous}px)`;

    // loop...
    requestAnimationFrame(() => this.render());
  }
}

// Some DOM elements
const DOM = {
  slides: [...document.querySelectorAll(".slide")],
  cursor: document.querySelector(".cursor"),
  backCtrl: document.querySelector(".frame__back"),
  navigationItems: document.querySelectorAll(".frame__nav > .frame__nav-button")
};
// cursor text chars
DOM.cursorChars = DOM.cursor.querySelectorAll(".word > .char, .whitespace");
// backCtrl text chars
DOM.backChars = DOM.backCtrl.querySelectorAll(".word > .char, .whitespace");

// total number of slides
const totalSlides = DOM.slides.length;

let slidesArr = [];
DOM.slides.forEach((slide) => {
  slidesArr.push(new Slide(slide));
});

// current slide position
let current = -1;
// check if animation is in progress
let isAnimating = false;

const setCurrentSlide = (position) => {
  if (current !== -1) {
    slidesArr[current].DOM.el.classList.remove("slide--current");
  }

  current = position;
  slidesArr[current].DOM.el.classList.add("slide--current");

  DOM.navigationItems[current].classList.add("frame__nav-button--current");
};

const next = () => {
  const newPosition = current < totalSlides - 1 ? current + 1 : 0;
  navigate(newPosition);
};

const prev = () => {
  const newPosition = current > 0 ? current - 1 : totalSlides - 1;
  navigate(newPosition);
};

const navigate = (newPosition) => {
  isAnimating = true;

  // change navigation current class
  DOM.navigationItems[current].classList.remove("frame__nav-button--current");
  DOM.navigationItems[newPosition].classList.add("frame__nav-button--current");

  // navigation direction
  const direction =
    current < newPosition
      ? current === 0 && newPosition === totalSlides - 1
        ? "prev"
        : "next"
      : current === totalSlides - 1 && newPosition === 0
      ? "next"
      : "prev";

  const currentSlide = slidesArr[current];
  current = newPosition;
  const upcomingSlide = slidesArr[current];

  gsap
    .timeline({
      defaults: {
        duration: 1.6,
        ease: "power3.inOut"
      },
      onComplete: () => {
        currentSlide.DOM.el.classList.remove("slide--current");
        // Close the current slide if it was open
        if (currentSlide.isOpen) {
          hideContent(currentSlide);
        }

        isAnimating = false;
      }
    })
    .addLabel("start", 0)

    .set(
      [currentSlide.DOM.imgInner, upcomingSlide.DOM.imgInner],
      {
        transformOrigin: direction === "next" ? "50% 0%" : "50% 100%"
      },
      "start"
    )

    // Place coming slide either above (translate -100%) or below (translate 100%) and the slide__inner to the opposite translate.
    .set(
      upcomingSlide.DOM.el,
      {
        yPercent: direction === "next" ? 100 : -100
      },
      "start"
    )
    .set(
      upcomingSlide.DOM.inner,
      {
        yPercent: direction === "next" ? -100 : 100
      },
      "start"
    )

    // Add current class
    .add(() => {
      upcomingSlide.DOM.el.classList.add("slide--current");
    }, "start")

    // hide the back button and show back the cursor text if the current slide was open
    .add(() => {
      if (currentSlide.isOpen) {
        toggleCursorBackTexts();
      }
    }, "start")

    // Current slide moves either up or down (translate 100% or -100%)
    .to(
      currentSlide.DOM.el,
      {
        yPercent: direction === "next" ? -100 : 100
      },
      "start"
    )
    .to(
      currentSlide.DOM.imgInner,
      {
        scaleY: 2
      },
      "start"
    )
    // Upcoming slide translates to 0
    .to(
      [upcomingSlide.DOM.el, upcomingSlide.DOM.inner],
      {
        yPercent: 0
      },
      "start"
    )
    .to(
      upcomingSlide.DOM.imgInner,
      {
        ease: "power2.inOut",
        startAt: { scaleY: 2 },
        scaleY: 1
      },
      "start"
    );
};

const toggleCursorBackTexts = (isContent) => {
  return gsap
    .timeline({
      onStart: () => {
        gsap.set(DOM.backChars, { opacity: isContent ? 0 : 1 });
        if (isContent) {
          DOM.backCtrl.classList.add("frame__back--show");
        }
      },
      onComplete: () => {
        DOM.backCtrl.classList[isContent ? "add" : "remove"](
          "frame__back--show"
        );
        if (!isContent) {
          DOM.backCtrl.classList.remove("frame__back--show");
        }
      }
    })
    .to(DOM.cursorChars, {
      duration: 0.5,
      ease: "power1.inOut",
      opacity: isContent ? 0 : 1
    })
    .to(
      DOM.backChars,
      {
        duration: 0.5,
        ease: "power1.inOut",
        opacity: isContent ? 1 : 0
      },
      0
    );
};

const showContent = (position) => {
  if (isAnimating) return;
  isAnimating = true;

  const slide = slidesArr[position];

  slide.isOpen = true;

  gsap
    .timeline({
      defaults: {
        duration: 1.6,
        ease: "power3.inOut"
      },
      onStart: () => {},
      onComplete: () => {
        isAnimating = false;
      }
    })
    .addLabel("start", 0)
    .add(() => {
      toggleCursorBackTexts("content");
    }, "start")
    .to(
      slide.DOM.img,
      {
        yPercent: -100
      },
      "start"
    )
    .set(
      slide.DOM.imgInner,
      {
        transformOrigin: "50% 100%"
      },
      "start"
    )
    .to(
      slide.DOM.imgInner,
      {
        yPercent: 100,
        scaleY: 2
      },
      "start"
    )
    .to(
      slide.DOM.contentImg,
      {
        startAt: {
          transformOrigin: "50% 0%",
          scaleY: 1.5
        },
        scaleY: 1
      },
      "start"
    );
};

const hideContent = (slide, animate = false) => {
  // reset values
  isAnimating = true;

  const complete = () => {
    slide.isOpen = false;
    isAnimating = false;
  };

  if (animate) {
    gsap
      .timeline({
        defaults: {
          duration: 1.6,
          ease: "power3.inOut"
        },
        onComplete: complete
      })
      .addLabel("start", 0)
      .to(
        slide.DOM.img,
        {
          yPercent: 0
        },
        "start"
      )
      .to(
        slide.DOM.imgInner,
        {
          yPercent: 0,
          scaleY: 1
        },
        "start"
      );
  } else {
    gsap.set(slide.DOM.img, {
      yPercent: 0
    });
    gsap.set(slide.DOM.imgInner, {
      yPercent: 0,
      scaleY: 1
    });
    complete();
  }
};

const initEvents = () => {
  // Links navigation
  [...DOM.navigationItems].forEach((item, position) => {
    item.addEventListener("click", () => {
      if (current === position || isAnimating) return;
      navigate(position);
    });
  });

  // Back click
  DOM.backCtrl.addEventListener("click", () => {
    if (isAnimating) return;
    isAnimating = true;
    toggleCursorBackTexts();
    hideContent(slidesArr[current], true);
  });

  // Initialize the GSAP Observer plugin
  Observer.create({
    type: "wheel,touch,pointer",
    onDown: () => !isAnimating && prev(),
    onUp: () => !isAnimating && next(),
    // invert the mouse wheel delta
    wheelSpeed: -1,
    tolerance: 10
  });

  for (const [position, slide] of slidesArr.entries()) {
    slide.DOM.img.addEventListener("click", () => {
      showContent(position);
    });
  }
};

// Set current slide
setCurrentSlide(0);

// Initialize custom cursor
new CursorText(DOM.cursor);

// Initialize the events
initEvents();
