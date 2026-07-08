(function () {
  var root = document.documentElement;
  var toggle = document.querySelector(".theme-toggle");
  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var navTabs = document.querySelector(".nav-tabs");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav-tabs a"));
  var themeColor = document.querySelector('meta[name="theme-color"]');
  var slides = Array.prototype.slice.call(document.querySelectorAll(".review-slide"));
  var previous = document.querySelector(".review-arrow.previous");
  var next = document.querySelector(".review-arrow.next");
  var coreMore = document.querySelector(".tag-more");
  var coreTagList = document.querySelector("#core-extra-tags");
  var coreExtraTags = Array.prototype.slice.call(document.querySelectorAll(".core-extra-tag"));
  var activeSlide = 0;
  var mobileNavQuery = window.matchMedia("(max-width: 760px)");

  function applyTheme(theme) {
    root.dataset.theme = theme;

    if (themeColor) {
      themeColor.setAttribute("content", theme === "dark" ? "#061f37" : "#57c9e0");
    }

    if (toggle) {
      toggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      toggle.innerHTML =
        theme === "dark"
          ? '<i class="ri-sun-line" aria-hidden="true"></i>'
          : '<i class="ri-moon-line" aria-hidden="true"></i>';
    }
  }

  function applyNavState(collapsed) {
    if (!header || !navToggle || !navTabs) {
      return;
    }

    header.classList.toggle("nav-collapsed", collapsed);
    navTabs.setAttribute("aria-hidden", collapsed ? "true" : "false");
    navToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    navToggle.setAttribute("aria-label", collapsed ? "Show navigation links" : "Hide navigation links");

    var mobileMenuIcon = navToggle.querySelector(".nav-toggle-menu");
    if (mobileMenuIcon) {
      mobileMenuIcon.className = collapsed
        ? "nav-toggle-menu ri-menu-3-line"
        : "nav-toggle-menu ri-close-line";
    }

    navLinks.forEach(function (link) {
      if (collapsed) {
        link.setAttribute("tabindex", "-1");
      } else {
        link.removeAttribute("tabindex");
      }
    });
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem("pijon-theme", theme);
    } catch (error) {
      return;
    }
  }

  function showSlide(index) {
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach(function (slide, slideIndex) {
      slide.classList.toggle("is-active", slideIndex === activeSlide);
    });
  }

  function applyCoreTags(expanded) {
    if (!coreMore) {
      return;
    }

    if (coreTagList) {
      coreTagList.classList.toggle("is-expanded", expanded);
    }

    coreExtraTags.forEach(function (tag) {
      if (expanded) {
        tag.removeAttribute("hidden");
        tag.setAttribute("aria-hidden", "false");
      } else {
        tag.setAttribute("hidden", "");
        tag.setAttribute("aria-hidden", "true");
      }
    });

    coreMore.textContent = expanded ? "-4" : "+4";
    coreMore.setAttribute("aria-expanded", expanded ? "true" : "false");
    coreMore.setAttribute(
      "aria-label",
      expanded ? "Hide 4 Core checks" : "Show 4 more Core checks"
    );
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      storeTheme(nextTheme);
    });
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var collapsed = !header.classList.contains("nav-collapsed");
      applyNavState(collapsed);
    });
  }

  if (coreMore) {
    coreMore.addEventListener("click", function () {
      var expanded = coreMore.getAttribute("aria-expanded") === "true";
      applyCoreTags(!expanded);
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (mobileNavQuery.matches) {
        applyNavState(true);
      }
    });
  });

  if (mobileNavQuery.addEventListener) {
    mobileNavQuery.addEventListener("change", function (event) {
      applyNavState(event.matches);
    });
  } else if (mobileNavQuery.addListener) {
    mobileNavQuery.addListener(function (event) {
      applyNavState(event.matches);
    });
  }

  if (previous && next && slides.length) {
    previous.addEventListener("click", function () {
      showSlide(activeSlide - 1);
    });

    next.addEventListener("click", function () {
      showSlide(activeSlide + 1);
    });
  }

  applyTheme(root.dataset.theme || "light");
  applyNavState(mobileNavQuery.matches);
  applyCoreTags(false);
  showSlide(0);
})();
