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
  var premiumTrigger = document.querySelector(".premium-trigger");
  var audioContext = null;
  var activeSlide = 0;
  var mobileNavQuery = window.matchMedia("(max-width: 760px)");
  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

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

  function playThemeSound(theme) {
    var AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    try {
      audioContext = audioContext || new AudioContext();

      var playNotes = function () {
        var now = audioContext.currentTime;
        var frequencies = theme === "light" ? [392, 587.33] : [523.25, 329.63];

        frequencies.forEach(function (frequency, index) {
          var oscillator = audioContext.createOscillator();
          var gain = audioContext.createGain();
          var start = now + index * 0.07;

          oscillator.type = index === 0 ? "sine" : "triangle";
          oscillator.frequency.setValueAtTime(frequency, start);
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(0.035, start + 0.018);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
          oscillator.connect(gain);
          gain.connect(audioContext.destination);
          oscillator.start(start);
          oscillator.stop(start + 0.21);
        });
      };

      if (audioContext.state === "suspended") {
        audioContext.resume().then(playNotes).catch(function () {});
      } else {
        playNotes();
      }
    } catch (error) {
      return;
    }
  }

  function createPremiumBurst(trigger) {
    var rect = trigger.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var colors = ["#ffc300", "#ff1181", "#00e7ff", "#ff7e00", "#8a5cff", "#2bff76"];
    var burst = document.createElement("span");
    var ring = document.createElement("span");

    burst.className = "premium-click-burst";
    burst.style.left = centerX + "px";
    burst.style.top = centerY + "px";
    burst.setAttribute("aria-hidden", "true");
    ring.className = "premium-click-ring";
    burst.appendChild(ring);

    for (var index = 0; index < 14; index += 1) {
      var angle = (Math.PI * 2 * index) / 14;
      var distance = 54 + (index % 3) * 14;
      var spark = document.createElement("span");

      spark.className = "premium-click-spark";
      spark.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      spark.style.setProperty("--dy", Math.sin(angle) * distance + "px");
      spark.style.setProperty("--spark-color", colors[index % colors.length]);
      spark.style.setProperty("--spark-rotation", angle * (180 / Math.PI) + 90 + "deg");
      spark.style.setProperty("--spark-delay", (index % 2) * 24 + "ms");
      burst.appendChild(spark);
    }

    document.body.appendChild(burst);
    window.setTimeout(function () {
      burst.remove();
    }, 850);
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
      playThemeSound(nextTheme);
    });
  }

  if (premiumTrigger) {
    premiumTrigger.addEventListener("click", function (event) {
      var href = premiumTrigger.getAttribute("href");
      var opensSeparately =
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        premiumTrigger.target === "_blank";

      if (!href || href.charAt(0) === "#" || opensSeparately || reducedMotionQuery.matches) {
        return;
      }

      event.preventDefault();

      if (premiumTrigger.classList.contains("is-launching")) {
        return;
      }

      premiumTrigger.classList.add("is-launching");
      createPremiumBurst(premiumTrigger);
      document.body.classList.add("premium-leaving");

      window.setTimeout(function () {
        window.location.href = href;
      }, 520);
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
  if (slides.length) {
    showSlide(0);
  }
})();
