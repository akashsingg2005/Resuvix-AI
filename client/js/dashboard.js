/* ===========================================================
   RESUVIX AI DASHBOARD
=========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    initDashboard();

});

/* ===========================================================
   INITIALIZE
=========================================================== */

function initDashboard(){

    checkAuthentication();

    loadUser();

    updateGreeting();

    sidebarController();

    profileMenu();

    activeNavigation();

    pageLoader();

    logoutHandler();

}

/* ===========================================================
   AUTH
=========================================================== */

function checkAuthentication(){

    const token = localStorage.getItem("token");

    if(!token){

        window.location.href="../pages/login.html";

    }

}

/* ===========================================================
   USER
=========================================================== */

function loadUser(){

    const user=JSON.parse(

        localStorage.getItem("user")

    );

    if(!user) return;

    const name=user.name || "User";

    const avatar=name.charAt(0).toUpperCase();

    document.querySelectorAll(

        "#sidebarUser,#navbarUser"

    ).forEach(el=>{

        el.textContent=name;

    });

    document.querySelectorAll(

        "#sidebarAvatar,.profile-avatar.small"

    ).forEach(el=>{

        el.textContent=avatar;

    });

}

/* ===========================================================
   GREETING
=========================================================== */

function updateGreeting(){

    const greeting=document.getElementById(

        "greeting"

    );

    if(!greeting) return;

    const hour=new Date().getHours();

    let text="";

    if(hour<12){

        text="Good Morning,";

    }

    else if(hour<17){

        text="Good Afternoon,";

    }

    else{

        text="Good Evening,";

    }

    greeting.textContent=text;

}

/* ===========================================================
   SIDEBAR
=========================================================== */

function sidebarController(){

    const sidebar=document.getElementById(

        "sidebar"

    );

    const menu=document.getElementById(

        "menuToggle"

    );

    const overlay=document.getElementById(

        "sidebarOverlay"

    );

    if(!sidebar || !menu) return;

    menu.addEventListener("click",()=>{

        if(window.innerWidth<=992){

            sidebar.classList.toggle("show");

            overlay.classList.toggle("show");

        }

        else{

            sidebar.classList.toggle(

                "collapsed"

            );

        }

    });

    overlay?.addEventListener(

        "click",

        ()=>{

            sidebar.classList.remove("show");

            overlay.classList.remove("show");

        }

    );

}

/* ===========================================================
   PROFILE MENU
=========================================================== */

function profileMenu(){

    const profile=document.querySelector(

        ".profile-dropdown"

    );

    const menu=document.getElementById(

        "profileMenu"

    );

    if(!profile || !menu) return;

    profile.addEventListener(

        "click",

        ()=>{

            menu.classList.toggle("show");

        }

    );

    window.addEventListener(

        "click",

        e=>{

            if(

                !profile.contains(e.target)

                &&

                !menu.contains(e.target)

            ){

                menu.classList.remove("show");

            }

        }

    );

}