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
  var releasePill = document.querySelector(".release-pill");
  var premiumTrigger = document.querySelector(".premium-trigger");
  var homeBrand = document.querySelector(".site-header .brand");
  var premiumFeatures = Array.prototype.slice.call(document.querySelectorAll(".premium-feature"));
  var premiumViewButtons = Array.prototype.slice.call(
    document.querySelectorAll("[data-premium-view]")
  );
  var premiumViews = Array.prototype.slice.call(
    document.querySelectorAll("[data-premium-panel]")
  );
  var checkoutForm = document.querySelector(".checkout-form");
  var checkoutPlanName = document.querySelector("[data-checkout-plan]");
  var checkoutPlanPrice = document.querySelector("[data-checkout-price]");
  var checkoutPlanInterval = document.querySelector("[data-checkout-interval]");
  var checkoutPlanCapacity = document.querySelector("[data-checkout-capacity]");
  var checkoutStatus = document.querySelector(".checkout-status");
  var audioContext = null;
  var soundPlayers = {};
  var hapticsReady = false;
  var lastHapticScroll = window.scrollY;
  var lastHapticTime = 0;
  var mascotPeek = null;
  var mascotHideTimer = null;
  var previousMascotPosition = -1;
  var lastConfettiSoundAt = 0;
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

    var desktopArrow = navToggle.querySelector(".nav-toggle-arrow");
    if (desktopArrow) {
      desktopArrow.className = collapsed
        ? "nav-toggle-arrow ri-arrow-down-s-line"
        : "nav-toggle-arrow ri-arrow-right-s-line";
    }

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

  function triggerHaptic(duration) {
    if (navigator.vibrate && !reducedMotionQuery.matches) {
      try {
        navigator.vibrate(duration || 10);
      } catch (error) {
        return;
      }
    }
  }

  function playSoundAsset(name, fallback) {
    try {
      if (!soundPlayers[name]) {
        soundPlayers[name] = new Audio("./assets/sounds/" + name + ".wav");
        soundPlayers[name].preload = "auto";
        soundPlayers[name].playsInline = true;
      }

      var player = soundPlayers[name];
      player.currentTime = 0;
      var playback = player.play();

      if (playback && playback.catch) {
        playback.catch(fallback);
      }
    } catch (error) {
      fallback();
    }
  }

  function preloadSounds() {
    ["switch", "premium", "tick", "confetti"].forEach(function (name) {
      if (!soundPlayers[name]) {
        soundPlayers[name] = new Audio("./assets/sounds/" + name + ".wav");
        soundPlayers[name].preload = "auto";
        soundPlayers[name].playsInline = true;
      }
    });
  }

  function withAudioContext(play) {
    var AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    try {
      if (!audioContext || audioContext.state === "closed") {
        audioContext = new AudioContext();
      }

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(function () {});
      }
      play(audioContext);
    } catch (error) {
      return;
    }
  }

  function scheduleSwitchClick(context, start, level, frequency) {
    var sampleCount = Math.floor(context.sampleRate * 0.018);
    var buffer = context.createBuffer(1, sampleCount, context.sampleRate);
    var data = buffer.getChannelData(0);
    var source = context.createBufferSource();
    var filter = context.createBiquadFilter();
    var noiseGain = context.createGain();
    var oscillator = context.createOscillator();
    var toneGain = context.createGain();

    for (var sample = 0; sample < sampleCount; sample += 1) {
      var envelope = Math.pow(1 - sample / sampleCount, 3);
      data[sample] = (Math.random() * 2 - 1) * envelope;
    }

    source.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1200, start);
    noiseGain.gain.setValueAtTime(level, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.026);
    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(context.destination);
    source.start(start);

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, start);
    toneGain.gain.setValueAtTime(level * 0.42, start);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.032);
    oscillator.connect(toneGain);
    toneGain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.035);
  }

  function synthThemeSound(theme) {
    withAudioContext(function (context) {
      var now = context.currentTime;
      var baseFrequency = theme === "light" ? 155 : 108;

      scheduleSwitchClick(context, now, 0.08, baseFrequency);
      scheduleSwitchClick(context, now + 0.038, 0.045, baseFrequency * 0.72);
    });
  }

  function playThemeSound(theme) {
    playSoundAsset("switch", function () {
      synthThemeSound(theme);
    });
  }

  function synthPremiumSound() {
    withAudioContext(function (context) {
      var now = context.currentTime;
      var notes = [587.33, 739.99, 880, 1174.66];
      var foundation = context.createOscillator();
      var foundationGain = context.createGain();

      foundation.type = "sine";
      foundation.frequency.setValueAtTime(293.66, now);
      foundationGain.gain.setValueAtTime(0.0001, now);
      foundationGain.gain.exponentialRampToValueAtTime(0.024, now + 0.035);
      foundationGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
      foundation.connect(foundationGain);
      foundationGain.connect(context.destination);
      foundation.start(now);
      foundation.stop(now + 0.74);

      notes.forEach(function (frequency, index) {
        var start = now + index * 0.09;
        var oscillator = context.createOscillator();
        var overtone = context.createOscillator();
        var gain = context.createGain();
        var overtoneGain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        overtone.type = "triangle";
        overtone.frequency.setValueAtTime(frequency * 2, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.032, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
        overtoneGain.gain.setValueAtTime(0.0001, start);
        overtoneGain.gain.exponentialRampToValueAtTime(0.008, start + 0.012);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.31);
        oscillator.connect(gain);
        overtone.connect(overtoneGain);
        gain.connect(context.destination);
        overtoneGain.connect(context.destination);
        oscillator.start(start);
        overtone.start(start);
        oscillator.stop(start + 0.5);
        overtone.stop(start + 0.34);
      });
    });
  }

  function playPremiumSound() {
    playSoundAsset("premium", synthPremiumSound);
  }

  function synthPremiumTick(index) {
    withAudioContext(function (context) {
      var now = context.currentTime;
      var frequencies = [880, 987.77, 1046.5, 1174.66, 1318.51, 1396.91];
      var oscillator = context.createOscillator();
      var overtone = context.createOscillator();
      var gain = context.createGain();
      var overtoneGain = context.createGain();
      var frequency = frequencies[index % frequencies.length];

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      overtone.type = "sine";
      overtone.frequency.setValueAtTime(frequency * 2, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.018, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      overtoneGain.gain.setValueAtTime(0.0001, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.004, now + 0.01);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      oscillator.connect(gain);
      overtone.connect(overtoneGain);
      gain.connect(context.destination);
      overtoneGain.connect(context.destination);
      oscillator.start(now);
      overtone.start(now);
      oscillator.stop(now + 0.24);
      overtone.stop(now + 0.16);
    });
  }

  function playPremiumTick(index) {
    playSoundAsset("tick", function () {
      synthPremiumTick(index);
    });
  }

  function playConfettiSound() {
    var now = Date.now();

    if (now - lastConfettiSoundAt < 500) {
      return;
    }

    lastConfettiSoundAt = now;
    playSoundAsset("confetti", function () {
      synthPremiumTick(5);
    });
  }

  function createPremiumBurst(trigger) {
    var rect = trigger.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var colors = ["#ff9300"];
    var burst = document.createElement("span");
    var ring = document.createElement("span");

    burst.className = "premium-click-burst";
    burst.style.left = centerX + "px";
    burst.style.top = centerY + "px";
    burst.setAttribute("aria-hidden", "true");
    ring.className = "premium-click-ring";
    burst.appendChild(ring);

    for (var index = 0; index < 6; index += 1) {
      var angle = (Math.PI * 2 * index) / 6;
      var distance = 30 + (index % 2) * 10;
      var spark = document.createElement("span");

      spark.className = "premium-click-spark";
      spark.style.setProperty("--dx", Math.cos(angle) * distance + "px");
      spark.style.setProperty("--dy", Math.sin(angle) * distance + "px");
      spark.style.setProperty("--spark-color", colors[index % colors.length]);
      spark.style.setProperty("--spark-rotation", angle * (180 / Math.PI) + 90 + "deg");
      spark.style.setProperty("--spark-delay", index * 14 + "ms");
      burst.appendChild(spark);
    }

    document.body.appendChild(burst);
    window.setTimeout(function () {
      burst.remove();
    }, 850);
  }

  function ensureMascotPeek() {
    if (mascotPeek) {
      return mascotPeek;
    }

    mascotPeek = document.createElement("div");
    mascotPeek.className = "mascot-peek";
    mascotPeek.setAttribute("aria-hidden", "true");
    mascotPeek.innerHTML =
      '<img src="./assets/mascot/mascot-peek.png" alt="" width="512" height="414" />';
    document.body.appendChild(mascotPeek);
    return mascotPeek;
  }

  function hideMascotPeek(delay) {
    window.clearTimeout(mascotHideTimer);
    mascotHideTimer = window.setTimeout(function () {
      if (mascotPeek) {
        mascotPeek.classList.remove("is-visible");
      }
    }, delay || 0);
  }

  function showMascotPeek() {
    var positions = [
      "mascot-peek-bottom-left",
      "mascot-peek-bottom-right",
      "mascot-peek-side-left",
      "mascot-peek-side-right"
    ];
    var nextPosition = Math.floor(Math.random() * positions.length);
    var mascot = ensureMascotPeek();

    if (positions.length > 1 && nextPosition === previousMascotPosition) {
      nextPosition = (nextPosition + 1 + Math.floor(Math.random() * (positions.length - 1))) %
        positions.length;
    }

    previousMascotPosition = nextPosition;
    window.clearTimeout(mascotHideTimer);
    mascot.className = "mascot-peek " + positions[nextPosition];
    var mascotImage = mascot.querySelector("img");
    var usesFullBody = positions[nextPosition].indexOf("side") !== -1;

    mascotImage.src = usesFullBody
      ? "./assets/mascot/mascot-side.png"
      : "./assets/mascot/mascot-peek.png";
    mascotImage.width = 512;
    mascotImage.height = usesFullBody ? 625 : 414;

    window.requestAnimationFrame(function () {
      mascot.classList.add("is-visible");
    });

    hideMascotPeek(2600);
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

  function applyPremiumView(viewName, withFeedback) {
    premiumViewButtons.forEach(function (button) {
      var selected = button.dataset.premiumView === viewName;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
      button.setAttribute("tabindex", selected ? "0" : "-1");
    });

    premiumViews.forEach(function (view) {
      var selected = view.dataset.premiumPanel === viewName;
      view.classList.toggle("is-active", selected);
      view.hidden = !selected;
    });

    if (withFeedback) {
      playPremiumTick(viewName === "plans" ? 1 : 4);
      triggerHaptic(12);
    }
  }

  function applyCheckoutPlan() {
    if (!checkoutPlanName || !checkoutPlanPrice || !checkoutPlanInterval || !checkoutPlanCapacity) {
      return;
    }

    var plans = {
      core: {
        name: "Core",
        price: "€299",
        interval: "/ month",
        capacity: "Up to 50k monthly players"
      },
      premium: {
        name: "Premium",
        price: "€799",
        interval: "/ month",
        capacity: "Up to 250k monthly players"
      },
      scale: {
        name: "Scale",
        price: "€149",
        interval: "/ 100k players",
        capacity: "Usage-based and billed monthly"
      }
    };
    var requestedPlan = new URLSearchParams(window.location.search).get("plan") || "premium";
    var plan = plans[requestedPlan] || plans.premium;

    checkoutPlanName.textContent = plan.name;
    checkoutPlanPrice.textContent = plan.price;
    checkoutPlanInterval.textContent = plan.interval;
    checkoutPlanCapacity.textContent = plan.capacity;
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      storeTheme(nextTheme);
      playThemeSound(nextTheme);
      triggerHaptic(12);
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

      if (!href || href.charAt(0) === "#" || opensSeparately) {
        return;
      }

      event.preventDefault();

      if (premiumTrigger.classList.contains("is-launching")) {
        return;
      }

      premiumTrigger.classList.add("is-launching");
      if (!reducedMotionQuery.matches) {
        createPremiumBurst(premiumTrigger);
        document.body.classList.add("premium-leaving");
      }
      playPremiumSound();
      triggerHaptic(18);

      window.setTimeout(function () {
        window.location.href = href;
      }, reducedMotionQuery.matches ? 720 : 820);
    });
  }

  if (homeBrand) {
    homeBrand.addEventListener("pointerenter", showMascotPeek);
    homeBrand.addEventListener("focus", showMascotPeek);
    homeBrand.addEventListener("blur", function () {
      hideMascotPeek(180);
    });
  }

  if (releasePill) {
    releasePill.addEventListener("pointerenter", playConfettiSound);
    releasePill.addEventListener("focus", playConfettiSound);
  }

  premiumFeatures.forEach(function (feature, featureIndex) {
    feature.setAttribute("aria-pressed", "false");
    feature.addEventListener("click", function () {
      premiumFeatures.forEach(function (item) {
        var selected = item === feature;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      playPremiumTick(featureIndex);
      triggerHaptic(10);
    });
  });

  premiumViewButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyPremiumView(button.dataset.premiumView, true);
    });
    button.addEventListener("keydown", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }

      event.preventDefault();
      var direction = event.key === "ArrowRight" ? 1 : -1;
      var currentIndex = premiumViewButtons.indexOf(button);
      var nextIndex = (currentIndex + direction + premiumViewButtons.length) % premiumViewButtons.length;
      var nextButton = premiumViewButtons[nextIndex];
      nextButton.focus();
      applyPremiumView(nextButton.dataset.premiumView, true);
    });
  });

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (event) {
      event.preventDefault();
      playPremiumTick(3);
      triggerHaptic(15);
      if (checkoutStatus) {
        checkoutStatus.textContent =
          "Your plan is ready. Connect a Stripe Checkout URL here before accepting payments.";
      }
    });
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var collapsed = !header.classList.contains("nav-collapsed");
      applyNavState(collapsed);
      triggerHaptic(8);
    });
  }

  if (coreMore) {
    coreMore.addEventListener("click", function () {
      var expanded = coreMore.getAttribute("aria-expanded") === "true";
      applyCoreTags(!expanded);
      triggerHaptic(8);
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (mobileNavQuery.matches) {
        applyNavState(true);
      }
    });
  });

  ["pointerdown", "touchstart", "keydown"].forEach(function (eventName) {
    window.addEventListener(
      eventName,
      function () {
        hapticsReady = true;
        lastHapticScroll = window.scrollY;
      },
      { once: true, passive: true }
    );
  });

  window.addEventListener(
    "scroll",
    function () {
      var now = Date.now();
      var distance = Math.abs(window.scrollY - lastHapticScroll);

      if (!hapticsReady || distance < 72 || now - lastHapticTime < 55) {
        return;
      }

      lastHapticScroll = window.scrollY;
      lastHapticTime = now;
      triggerHaptic(3);
    },
    { passive: true }
  );

  if (mobileNavQuery.addEventListener) {
    mobileNavQuery.addEventListener("change", function () {
      applyNavState(true);
    });
  } else if (mobileNavQuery.addListener) {
    mobileNavQuery.addListener(function () {
      applyNavState(true);
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
  preloadSounds();
  applyNavState(true);
  applyCoreTags(false);
  if (premiumViewButtons.length) {
    applyPremiumView("plans", false);
  }
  applyCheckoutPlan();
  if (slides.length) {
    showSlide(0);
  }
})();
