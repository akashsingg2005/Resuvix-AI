/* ==========================================================
   HOME JS
   PART 1
   Hero • Parallax • Company Slider
========================================================== */

"use strict";

/* ==========================================================
   INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initHeroTyping();

    initHeroParallax();

    initFloatingDashboard();

    initCompanySlider();

    initFAQAccordion();

    fetchDatabasePricing();

});


/* ==========================================================
   HERO TYPING EFFECT
========================================================== */

function initHeroTyping(){

    const element = document.querySelector("[data-typing]");

    if(!element) return;

    const words = [
        "ATS-Friendly",
        "Professional",
        "Modern",
        "AI-Powered",
        "Job-Winning"
    ];

    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function type(){

        const word = words[wordIndex];

        element.textContent = word.substring(0,charIndex);

        if(!deleting){

            charIndex++;

            if(charIndex > word.length){

                deleting = true;

                setTimeout(type,1400);

                return;

            }

        }else{

            charIndex--;

            if(charIndex < 0){

                deleting = false;

                wordIndex = (wordIndex + 1) % words.length;

                charIndex = 0;

            }

        }

        setTimeout(type,deleting ? 60 : 110);

    }

    type();

}


/* ==========================================================
   HERO PARALLAX
========================================================== */

function initHeroParallax(){

    const hero = document.querySelector(".hero");

    const dashboard = document.querySelector(".dashboard");

    if(!hero || !dashboard) return;

    hero.addEventListener("mousemove",(e)=>{

        const rect = hero.getBoundingClientRect();

        const x = (e.clientX - rect.left) / rect.width;

        const y = (e.clientY - rect.top) / rect.height;

        const moveX = (x - .5) * 18;

        const moveY = (y - .5) * 18;

        dashboard.style.transform =

            `translate(${moveX}px,${moveY}px)`;

    });

    hero.addEventListener("mouseleave",()=>{

        dashboard.style.transform =

            "translate(0,0)";

    });

}


/* ==========================================================
   FLOATING DASHBOARD
========================================================== */

function initFloatingDashboard(){

    const dashboard = document.querySelector(".dashboard");

    if(!dashboard) return;

    let start = null;

    function animate(timestamp){

        if(!start) start = timestamp;

        const progress = (timestamp - start) / 1000;

        const y = Math.sin(progress * 1.2) * 8;

        dashboard.style.marginTop = `${y}px`;

        requestAnimationFrame(animate);

    }

    requestAnimationFrame(animate);

}


/* ==========================================================
   COMPANY AUTO SLIDER
========================================================== */

function initCompanySlider(){

    const slider = document.querySelector(".company-slider");

    if(!slider) return;

    const items = [...slider.children];

    if(items.length < 2) return;

    items.forEach(item=>{

        slider.appendChild(item.cloneNode(true));

    });

    let offset = 0;

    function animate(){

        offset += .45;

        if(offset >= slider.scrollWidth / 2){

            offset = 0;

        }

        slider.scrollLeft = offset;

        requestAnimationFrame(animate);

    }

    animate();

}

/* ==========================================================
   HOME JS
   PART 2
   Dashboard • ATS Score • Live Updates • Templates
========================================================== */


/* ==========================================================
   INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initATSScore();

    initDashboardUpdates();

    initStatTicker();

    initTemplateEffects();

});


/* ==========================================================
   ATS SCORE ANIMATION
========================================================== */

function initATSScore(){

    const score = document.querySelector("[data-ats-score]");

    if(!score) return;

    const target = Number(score.dataset.atsScore) || 98;

    let current = 0;

    const timer = setInterval(()=>{

        current++;

        score.textContent = current + "%";

        if(current >= target){

            clearInterval(timer);

        }

    },25);

}


/* ==========================================================
   LIVE DASHBOARD
========================================================== */

function initDashboardUpdates(){

    const liveElement = document.querySelector(".live");

    if(!liveElement) return;

    const messages = [

        "Resume Analysed",

        "Keyword Score Updated",

        "ATS Passed",

        "Template Optimised",

        "AI Suggestions Ready"

    ];

    let index = 0;

    setInterval(()=>{

        liveElement.textContent =

            "● " + messages[index];

        index = (index + 1) % messages.length;

    },3000);

}


/* ==========================================================
   STAT TICKER
========================================================== */

function initStatTicker(){

    const stats = document.querySelectorAll("[data-stat]");

    if(!stats.length) return;

    stats.forEach(stat=>{

        const original = Number(stat.dataset.stat);

        let direction = 1;

        let value = original;

        setInterval(()=>{

            value += direction;

            if(value >= original + 2){

                direction = -1;

            }

            if(value <= original){

                direction = 1;

            }

            stat.textContent = value;

        },1200);

    });

}


/* ==========================================================
   TEMPLATE HOVER EFFECT
========================================================== */

function initTemplateEffects(){

    const cards = document.querySelectorAll(".template-card");

    if(!cards.length) return;

    cards.forEach(card=>{

        card.addEventListener("mousemove",(e)=>{

            const rect = card.getBoundingClientRect();

            const x = e.clientX - rect.left;

            const y = e.clientY - rect.top;

            const rotateY =

                ((x / rect.width) - 0.5) * 10;

            const rotateX =

                ((y / rect.height) - 0.5) * -10;

            card.style.transform =

                `perspective(900px)
                 rotateX(${rotateX}deg)
                 rotateY(${rotateY}deg)
                 translateY(-8px)`;

        });

        card.addEventListener("mouseleave",()=>{

            card.style.transform = "";

        });

    });

}


/* ==========================================================
   DASHBOARD PROGRESS
========================================================== */

function initDashboardProgress(){

    const progress = document.querySelector(".progress-fill");

    if(!progress) return;

    let value = 0;

    const target = parseInt(

        progress.dataset.width || "90"

    );

    const timer = setInterval(()=>{

        value++;

        progress.style.width = value + "%";

        if(value >= target){

            clearInterval(timer);

        }

    },15);

}

document.addEventListener(

    "DOMContentLoaded",

    initDashboardProgress

);

/* ==========================================================
   HOME JS
   PART 3
   Landing Page Effects & Final Initialization
========================================================== */


/* ==========================================================
   INITIALIZATION
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initPageEntrance();

    initCTASparkles();

    initFloatingParticles();

    initHeroGlow();

});


/* ==========================================================
   PAGE ENTRANCE
========================================================== */

function initPageEntrance(){

    document.body.classList.add("page-loaded");

    const animated = document.querySelectorAll(

        ".hero-left, .hero-right, .feature-card, .template-card"

    );

    animated.forEach((element,index)=>{

        element.style.opacity = "0";

        element.style.transform = "translateY(40px)";

        setTimeout(()=>{

            element.style.transition =
                "all .7s cubic-bezier(.2,.8,.2,1)";

            element.style.opacity = "1";

            element.style.transform = "translateY(0)";

        },120 * index);

    });

}


/* ==========================================================
   CTA SPARKLES
========================================================== */

function initCTASparkles(){

    const cta = document.querySelector(".cta-banner");

    if(!cta) return;

    setInterval(()=>{

        const sparkle = document.createElement("span");

        sparkle.className = "cta-sparkle";

        sparkle.style.left = Math.random()*100 + "%";

        sparkle.style.top = Math.random()*100 + "%";

        sparkle.style.animationDuration =
            (1.5 + Math.random()).toFixed(2) + "s";

        cta.appendChild(sparkle);

        setTimeout(()=>{

            sparkle.remove();

        },2500);

    },350);

}


/* ==========================================================
   FLOATING PARTICLES
========================================================== */

function initFloatingParticles(){

    const hero = document.querySelector(".hero");

    if(!hero) return;

    const total = 15;

    for(let i=0;i<total;i++){

        const particle = document.createElement("span");

        particle.className = "hero-particle";

        particle.style.left = Math.random()*100 + "%";

        particle.style.top = Math.random()*100 + "%";

        particle.style.animationDelay =
            (Math.random()*5).toFixed(2) + "s";

        particle.style.animationDuration =
            (5 + Math.random()*5).toFixed(2) + "s";

        hero.appendChild(particle);

    }

}


/* ==========================================================
   HERO GLOW
========================================================== */

function initHeroGlow(){

    const hero = document.querySelector(".hero");

    if(!hero) return;

    hero.addEventListener("mousemove",(e)=>{

        const rect = hero.getBoundingClientRect();

        const x = e.clientX - rect.left;

        const y = e.clientY - rect.top;

        hero.style.setProperty("--mouse-x",`${x}px`);

        hero.style.setProperty("--mouse-y",`${y}px`);

    });

}


/* ==========================================================
   TEMPLATE BUTTON RIPPLE
========================================================== */

document.querySelectorAll(".btn-gradient").forEach(button=>{

    button.addEventListener("click",function(e){

        const ripple = document.createElement("span");

        ripple.className = "ripple";

        const rect = this.getBoundingClientRect();

        ripple.style.left = `${e.clientX - rect.left}px`;

        ripple.style.top = `${e.clientY - rect.top}px`;

        this.appendChild(ripple);

        setTimeout(()=>{

            ripple.remove();

        },600);

    });

});


/* ==========================================================
   HERO PARALLAX ON SCROLL
========================================================== */

window.addEventListener("scroll",()=>{

    const hero = document.querySelector(".hero");

    if(!hero) return;

    const offset = window.scrollY * 0.25;

    hero.style.backgroundPositionY = `${offset}px`;

},{passive:true});


/* ==========================================================
   PERFORMANCE
========================================================== */

window.addEventListener("load",()=>{

    document.body.classList.add("loaded");

});


/* ==========================================================
   INTERACTIVE FAQ ACCORDION
========================================================== */

function initFAQAccordion() {
    const faqItems = document.querySelectorAll(".faq-item-accordion");
    faqItems.forEach(item => {
        const header = item.querySelector(".faq-header");
        const body = item.querySelector(".faq-body");
        const icon = item.querySelector(".faq-icon i");

        if (header && body) {
            header.addEventListener("click", () => {
                const isOpen = item.classList.contains("active");

                // Close all other accordions smoothly
                faqItems.forEach(other => {
                    other.classList.remove("active");
                    const otherBody = other.querySelector(".faq-body");
                    const otherIcon = other.querySelector(".faq-icon i");
                    if (otherBody) otherBody.style.maxHeight = null;
                    if (otherIcon) otherIcon.className = "ri-add-line";
                });

                if (!isOpen) {
                    item.classList.add("active");
                    body.style.maxHeight = body.scrollHeight + "px";
                    if (icon) icon.className = "ri-subtract-line";
                }
            });
        }
    });
}

/* ==========================================================
   DYNAMIC DATABASE PRICING FETCH
========================================================== */

async function fetchDatabasePricing() {
    try {
        const baseUrl = typeof API_CONFIG !== "undefined" ? API_CONFIG.BASE_URL : "http://localhost:5000";
        const res = await fetch(`${baseUrl}/api/v1/payment/pricing`);
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.success && data.pricing) {
            const singlePrice = data.pricing.singlePrice || 199;
            const proPrice = data.pricing.proPrice || 499;

            document.querySelectorAll(".val-single-price").forEach(el => el.textContent = singlePrice);
            document.querySelectorAll(".val-pro-price").forEach(el => el.textContent = proPrice);
        }
    } catch (e) {
        console.log("Using default fallback pricing:", e.message);
    }
}

console.log(

    "%c✨ Resuvix AI Landing Page Ready",

    "color:#06B6D4;font-size:14px;font-weight:bold;"

);