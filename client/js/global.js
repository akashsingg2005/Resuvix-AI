/* ==========================================================
   GLOBAL JS
   PART 1
   Navbar • Mobile Menu • Smooth Scroll • Active Links
========================================================== */

"use strict";

/* ==========================================================
   DOM READY
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initNavbar();

    initMobileMenu();

    initSmoothScroll();

    initActiveLinks();

});


/* ==========================================================
   ELEMENTS
========================================================== */

const navbar = document.querySelector(".navbar");

const menuBtn = document.querySelector(".menu-btn");

const navLinks = document.querySelector(".nav-links");

const links = document.querySelectorAll('.nav-links a[href^="#"]');


/* ==========================================================
   STICKY NAVBAR
========================================================== */

function initNavbar(){

    if(!navbar) return;

    const handleScroll = () => {

        if(window.scrollY > 40){

            navbar.classList.add("scrolled");

        }else{

            navbar.classList.remove("scrolled");

        }

    };

    handleScroll();

    window.addEventListener("scroll", handleScroll,{passive:true});

}


/* ==========================================================
   MOBILE MENU
========================================================== */

function initMobileMenu(){

    if(!menuBtn || !navLinks) return;

    const icon = menuBtn.querySelector("i");

    menuBtn.addEventListener("click",()=>{

        navLinks.classList.toggle("active");

        menuBtn.classList.toggle("active");

        document.body.classList.toggle("menu-open");

        if(icon){

            icon.className = navLinks.classList.contains("active")
                ? "ri-close-line"
                : "ri-menu-3-line";
        }

    });

}


/* ==========================================================
   SMOOTH SCROLL
========================================================== */

function initSmoothScroll(){

    links.forEach(link=>{

        link.addEventListener("click",(e)=>{

            const target = document.querySelector(link.getAttribute("href"));

            if(!target) return;

            e.preventDefault();

            const offset = navbar ? navbar.offsetHeight + 20 : 90;

            const top = target.offsetTop - offset;

            window.scrollTo({

                top,

                behavior:"smooth"

            });

        });

    });

}


/* ==========================================================
   ACTIVE NAVIGATION
========================================================== */

function initActiveLinks(){

    if(!links.length) return;

    const sections = [...links]

        .map(link=>{

            const id = link.getAttribute("href");

            return document.querySelector(id);

        })

        .filter(Boolean);

    const updateActive = () => {

        const scrollPos = window.scrollY + 140;

        sections.forEach(section=>{

            const top = section.offsetTop;

            const bottom = top + section.offsetHeight;

            const id = section.getAttribute("id");

            const currentLink = document.querySelector(
                `.nav-links a[href="#${id}"]`
            );

            if(!currentLink) return;

            if(scrollPos >= top && scrollPos < bottom){

                links.forEach(link=>link.classList.remove("active"));

                currentLink.classList.add("active");

            }

        });

    };

    updateActive();

    window.addEventListener("scroll",updateActive,{passive:true});

}

/* ==========================================================
   GLOBAL JS
   PART 2
   FAQ • Reveal • Counters • Progress Bars
========================================================== */


/* ==========================================================
   INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initFAQ();

    initRevealAnimations();

    initCounters();

    initProgressBars();

});


/* ==========================================================
   FAQ ACCORDION
========================================================== */

function initFAQ(){

    const items = document.querySelectorAll(".faq-item");

    if(!items.length) return;

    items.forEach(item=>{

        const question = item.querySelector("button");

        const answer = item.querySelector(".faq-answer");

        if(!question || !answer) return;

        question.addEventListener("click",()=>{

            const isOpen = item.classList.contains("active");

            items.forEach(faq=>{

                faq.classList.remove("active");

                const content = faq.querySelector(".faq-answer");

                if(content){

                    content.style.maxHeight = null;

                }

            });

            if(!isOpen){

                item.classList.add("active");

                answer.style.maxHeight = answer.scrollHeight + "px";

            }

        });

    });

}


/* ==========================================================
   SCROLL REVEAL
========================================================== */

function initRevealAnimations(){

    const elements = document.querySelectorAll(

        ".reveal,.reveal-left,.reveal-right"

    );

    if(!elements.length) return;

    const observer = new IntersectionObserver((entries)=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                entry.target.classList.add("active");

                observer.unobserve(entry.target);

            }

        });

    },{

        threshold:.15

    });

    elements.forEach(el=>observer.observe(el));

}


/* ==========================================================
   COUNTER ANIMATION
========================================================== */

function initCounters(){

    const counters = document.querySelectorAll("[data-counter]");

    if(!counters.length) return;

    const observer = new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(!entry.isIntersecting) return;

            const el = entry.target;

            const target = Number(el.dataset.counter);

            const duration = 1800;

            const start = performance.now();

            const update = now=>{

                const progress = Math.min((now-start)/duration,1);

                const value = Math.floor(progress*target);

                el.textContent = value.toLocaleString();

                if(progress<1){

                    requestAnimationFrame(update);

                }else{

                    el.textContent = target.toLocaleString();

                }

            };

            requestAnimationFrame(update);

            observer.unobserve(el);

        });

    },{

        threshold:.4

    });

    counters.forEach(counter=>observer.observe(counter));

}


/* ==========================================================
   PROGRESS BAR ANIMATION
========================================================== */

function initProgressBars(){

    const bars = document.querySelectorAll(".progress-fill");

    if(!bars.length) return;

    const observer = new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(!entry.isIntersecting) return;

            const bar = entry.target;

            const width = bar.dataset.width || "90%";

            bar.style.width = width;

            observer.unobserve(bar);

        });

    },{

        threshold:.35

    });

    bars.forEach(bar=>{

        bar.style.width = "0";

        observer.observe(bar);

    });

}

/* ==========================================================
   GLOBAL JS
   PART 3
   Back To Top • Scroll Progress • Utilities
========================================================== */


/* ==========================================================
   INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initBackToTop();

    initScrollProgress();

});


/* ==========================================================
   BACK TO TOP BUTTON
========================================================== */

function initBackToTop(){

    const button = document.querySelector(".back-to-top");

    if(!button) return;

    const toggleButton = throttle(()=>{

        if(window.scrollY > 500){

            button.classList.add("show");

        }else{

            button.classList.remove("show");

        }

    },100);

    window.addEventListener("scroll",toggleButton,{passive:true});

    button.addEventListener("click",()=>{

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    });

}


/* ==========================================================
   SCROLL PROGRESS BAR
========================================================== */

function initScrollProgress(){

    const progressBar = document.querySelector(".scroll-progress");

    if(!progressBar) return;

    const updateProgress = throttle(()=>{

        const scrollTop = window.scrollY;

        const pageHeight =
            document.documentElement.scrollHeight -
            window.innerHeight;

        const progress =
            pageHeight > 0
                ? (scrollTop / pageHeight) * 100
                : 0;

        progressBar.style.width = `${progress}%`;

    },16);

    window.addEventListener("scroll",updateProgress,{passive:true});

    updateProgress();

}


/* ==========================================================
   DEBOUNCE
========================================================== */

function debounce(fn,delay=200){

    let timer;

    return (...args)=>{

        clearTimeout(timer);

        timer = setTimeout(()=>{

            fn(...args);

        },delay);

    };

}


/* ==========================================================
   THROTTLE
========================================================== */

function throttle(fn,limit=100){

    let waiting = false;

    return (...args)=>{

        if(waiting) return;

        waiting = true;

        fn(...args);

        setTimeout(()=>{

            waiting = false;

        },limit);

    };

}


/* ==========================================================
   WINDOW RESIZE
========================================================== */

window.addEventListener(

    "resize",

    debounce(()=>{

        document.dispatchEvent(

            new Event("layout:resize")

        );

    },250)

);


/* ==========================================================
   PAGE VISIBILITY
========================================================== */

document.addEventListener(

    "visibilitychange",

    ()=>{

        document.body.classList.toggle(

            "page-hidden",

            document.hidden

        );

    }

);


/* ==========================================================
   IMAGE LAZY LOADING
========================================================== */

function initLazyImages(){

    const images = document.querySelectorAll(

        "img[data-src]"

    );

    if(!images.length) return;

    const observer = new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(!entry.isIntersecting) return;

            const img = entry.target;

            img.src = img.dataset.src;

            img.removeAttribute("data-src");

            observer.unobserve(img);

        });

    });

    images.forEach(img=>observer.observe(img));

}

document.addEventListener(

    "DOMContentLoaded",

    initLazyImages

);


/* ==========================================================
   CONSOLE MESSAGE
========================================================== */

console.log(

    "%c🚀 Resuvix AI Loaded Successfully",

    "color:#6C63FF;font-size:14px;font-weight:bold;"

);