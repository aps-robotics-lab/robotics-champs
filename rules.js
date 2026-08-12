/* =====================================================
   APS ROBOTICS CHAMPIONSHIP 2026
   RULES PAGE ANIMATIONS
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const cards = document.querySelectorAll(
        ".rules-grid article"
    );

    cards.forEach((card, index) => {

        card.style.opacity = "0";

        card.style.transform =
            "translateY(18px)";

        setTimeout(() => {

            card.style.transition =
                "opacity .5s ease, transform .5s ease";

            card.style.opacity = "1";

            card.style.transform =
                "translateY(0)";

        }, 80 + (index * 90));

    });


    /* =================================================
       TECHNICAL SPECIFICATION HOVER EFFECT
    ================================================= */

    const specifications =
        document.querySelectorAll(".spec-item");


    specifications.forEach(item => {

        item.addEventListener(
            "mouseenter",
            () => {
                item.classList.add("active");
            }
        );


        item.addEventListener(
            "mouseleave",
            () => {
                item.classList.remove("active");
            }
        );

    });

});
