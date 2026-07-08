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
  var premiumFeatures = Array.prototype.slice.call(document.querySelectorAll(".premium-feature"));
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

  function withAudioContext(play) {
    var AudioContext = window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      return;
    }

    try {
      audioContext = audioContext || new AudioContext();

      if (audioContext.state === "suspended") {
        audioContext.resume().then(function () {
          play(audioContext);
        }).catch(function () {});
      } else {
        play(audioContext);
      }
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

  function playThemeSound(theme) {
    withAudioContext(function (context) {
      var now = context.currentTime;
      var baseFrequency = theme === "light" ? 155 : 108;

      scheduleSwitchClick(context, now, 0.08, baseFrequency);
      scheduleSwitchClick(context, now + 0.038, 0.045, baseFrequency * 0.72);
    });
  }

  function playPremiumSound() {
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

  function playPremiumTick(index) {
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
      playPremiumSound();
      document.body.classList.add("premium-leaving");

      window.setTimeout(function () {
        window.location.href = href;
      }, 820);
    });
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
    });
  });

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
