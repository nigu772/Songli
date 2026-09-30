/* =========================================================
   SONGLI WIZARD FIX
   - Keine nativen Dropdown-Popups
   - Große Auswahlkarten
   - Erklärungen direkt unter den Optionen
   - 6-stellige Event-Codes
   - Mobile/Samsung optimiert
========================================================= */

(function () {
  "use strict";

  function songliWizardStyles() {
    if (document.getElementById("songli-wizard-fix-style")) return;

    const style = document.createElement("style");
    style.id = "songli-wizard-fix-style";

    style.textContent = `
      .wizard-intro {
        max-width: 680px;
        line-height: 1.65;
        margin-bottom: 26px;
      }

      .wizard-choice-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 18px;
      }

      .wizard-choice-list.compact {
        gap: 10px;
      }

      .wizard-choice {
        width: 100%;
        display: grid;
        grid-template-columns: 46px minmax(0,1fr) 32px;
        align-items: center;
        gap: 14px;
        padding: 17px 18px;
        text-align: left;

        border: 1px solid rgba(255,255,255,.10);
        border-radius: 18px;

        background: rgba(255,255,255,.025);
        color: var(--text, #fff);

        cursor: pointer;

        transition:
          transform .16s ease,
          border-color .16s ease,
          background .16s ease,
          box-shadow .16s ease;
      }

      .wizard-choice:hover {
        transform: translateY(-1px);
        background: rgba(255,255,255,.045);
        border-color: rgba(255,255,255,.18);
      }

      .wizard-choice:active {
        transform: scale(.99);
      }

      .wizard-choice.selected {
        border-color: rgba(67,230,165,.70);

        background:
          linear-gradient(
            135deg,
            rgba(139,124,255,.18),
            rgba(67,230,165,.08)
          );

        box-shadow:
          0 0 0 1px rgba(67,230,165,.12),
          0 14px 30px rgba(0,0,0,.16);
      }

      .choice-icon {
        width: 44px;
        height: 44px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 14px;

        background: rgba(255,255,255,.06);

        font-size: 21px;
      }

      .wizard-choice.selected .choice-icon {
        background: rgba(67,230,165,.12);
      }

      .choice-copy {
        min-width: 0;

        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .choice-copy strong {
        font-size: 16px;
        line-height: 1.25;
      }

      .choice-copy small {
        color: rgba(255,255,255,.58);
        font-size: 13px;
        line-height: 1.45;
        font-weight: 500;
      }

      .choice-check {
        width: 28px;
        height: 28px;

        border-radius: 50%;

        display: flex;
        align-items: center;
        justify-content: center;

        border: 1px solid rgba(255,255,255,.16);

        color: transparent;
        font-weight: 900;
      }

      .wizard-choice.selected .choice-check {
        color: #07120f;
        background: #43e6a5;
        border-color: #43e6a5;
      }

      .wizard-extra {
        display: none;

        margin-top: 18px;
        padding: 17px;

        border-radius: 18px;

        background: rgba(255,255,255,.025);
        border: 1px solid rgba(255,255,255,.08);

        animation: songliWizardFade .18s ease;
      }

      .wizard-extra.visible {
        display: block;
      }

      .wizard-section-title {
        margin-top: 27px;
        margin-bottom: 5px;

        font-weight: 800;
        font-size: 16px;
      }

      .wizard-section-text {
        margin: 0 0 12px;

        color: rgba(255,255,255,.55);

        font-size: 13px;
        line-height: 1.5;
      }

      .number-choice-grid {
        display: grid;
        grid-template-columns: repeat(5,minmax(0,1fr));
        gap: 9px;

        margin-bottom: 25px;
      }

      .number-choice {
        min-height: 50px;

        border-radius: 14px;

        border: 1px solid rgba(255,255,255,.10);

        background: rgba(255,255,255,.025);

        color: var(--text,#fff);

        font-size: 17px;
        font-weight: 800;

        cursor: pointer;

        transition:
          transform .15s ease,
          background .15s ease,
          border-color .15s ease;
      }

      .number-choice:hover {
        background: rgba(255,255,255,.05);
      }

      .number-choice:active {
        transform: scale(.96);
      }

      .number-choice.selected {
        border-color: rgba(67,230,165,.70);

        background:
          linear-gradient(
            135deg,
            rgba(139,124,255,.25),
            rgba(67,230,165,.12)
          );

        box-shadow:
          0 0 0 1px rgba(67,230,165,.10);
      }

      .security-note {
        display: flex;
        gap: 10px;

        align-items: flex-start;

        margin-top: 15px;
        padding: 14px 15px;

        border-radius: 15px;

        background: rgba(67,230,165,.06);
        border: 1px solid rgba(67,230,165,.12);

        color: rgba(255,255,255,.62);

        font-size: 13px;
        line-height: 1.5;
      }

      @keyframes songliWizardFade {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }

        to {
          opacity: 1;
          transform: none;
        }
      }

      @media(max-width:520px) {

        .wizard-choice {
          grid-template-columns: 40px minmax(0,1fr) 28px;
          gap: 11px;
          padding: 15px 13px;
        }

        .choice-icon {
          width: 40px;
          height: 40px;
        }

        .choice-copy strong {
          font-size: 15px;
        }

        .choice-copy small {
          font-size: 12px;
        }

        .number-choice-grid {
          gap: 7px;
        }
      }
    `;

    document.head.appendChild(style);
  }


  /* =======================================================
     ZUGANG AUSWÄHLEN
  ======================================================= */

  window.selectAccessMode = function (mode) {

    const password =
      document.getElementById("wizGuestPassword")?.value || "";

    state.wizard.accessMode = mode;

    if (password) {
      state.wizard.guestPassword = password;
    }

    renderWizard();
  };


  /* =======================================================
     SONG-LIMIT
  ======================================================= */

  window.selectSongLimit = function (limit) {

    state.wizard.songsPerGuest = Number(limit);

    renderWizard();
  };


  /* =======================================================
     PLAYLIST-REIHENFOLGE
  ======================================================= */

  window.selectPlaylistOrder = function (order) {

    state.wizard.playlistOrder = order;

    renderWizard();
  };


  /* =======================================================
     SICHTBARKEIT
  ======================================================= */

  window.selectRevealMode = function (mode) {

    state.wizard.revealMode = mode;

    renderWizard();
  };


  /* =======================================================
     WIZARD RENDER
  ======================================================= */

  window.renderWizard = function () {

    const w = state.wizard;

    const labels = [
      "Event",
      "Zugang",
      "Musik",
      "Creator",
      "Fertig"
    ];

    const progress =
      labels
        .map(
          (label,index) => `
            <div>
              <div class="step ${
                index + 1 <= state.wizardStep
                  ? "active"
                  : ""
              }"></div>

              <p class="step-label">
                ${label}
              </p>
            </div>
          `
        )
        .join("");


    let body = "";


    /* =====================================================
       SCHRITT 1
    ===================================================== */

    if (state.wizardStep === 1) {

      body = `
        <span class="eyebrow">
          SCHRITT 1 VON 4
        </span>

        <h1>
          Dein Event
        </h1>

        <p class="muted wizard-intro">
          Gib deinem Abend einen Namen und erzähl
          deinen Gästen kurz, was sie erwartet.
          Diese Informationen sehen deine Gäste
          später beim Beitreten.
        </p>

        <div class="wizard-body">

          <label>
            Eventname

            <input
              id="wizTitle"
              value="${esc(w.title)}"
              maxlength="100"
              placeholder="z. B. Nicos Geburtstag">
          </label>


          <label>
            Begrüßung

            <input
              id="wizWelcome"
              value="${esc(w.welcome)}"
              maxlength="160"
              placeholder="Schön, dass du da bist! 🎉">
          </label>


          <label>
            Beschreibung

            <textarea
              id="wizDescription"
              maxlength="500"
              placeholder="Erzähl deinen Gästen kurz, worum es geht …">${esc(w.description)}</textarea>
          </label>

        </div>
      `;
    }


    /* =====================================================
       SCHRITT 2
    ===================================================== */

    else if (state.wizardStep === 2) {

      body = `
        <span class="eyebrow">
          SCHRITT 2 VON 4
        </span>

        <h1>
          Zugang
        </h1>

        <p class="muted wizard-intro">
          Bestimme, wie deine Gäste dein Event betreten.
          Das Event wird nicht öffentlich im Internet
          aufgelistet. Der sechsstellige Code oder dein
          Einladungslink bleibt der Zugang.
        </p>


        <div class="wizard-choice-list">

          <button
            type="button"
            class="wizard-choice ${
              w.accessMode === "private"
                ? "selected"
                : ""
            }"
            onclick="selectAccessMode('private')">

            <span class="choice-icon">
              🔒
            </span>

            <span class="choice-copy">

              <strong>
                Privat · Code erforderlich
              </strong>

              <small>
                Nur Gäste, denen du deinen sechsstelligen
                Event-Code gibst, können beitreten.
                Optional kannst du zusätzlich ein
                Gäste-Passwort verlangen.
              </small>

            </span>

            <span class="choice-check">
              ${
                w.accessMode === "private"
                  ? "✓"
                  : ""
              }
            </span>

          </button>


          <button
            type="button"
            class="wizard-choice ${
              w.accessMode === "public"
                ? "selected"
                : ""
            }"
            onclick="selectAccessMode('public')">

            <span class="choice-icon">
              🔗
            </span>

            <span class="choice-copy">

              <strong>
                Offen · Code / Link
              </strong>

              <small>
                Jeder, dem du den Code oder Einladungslink
                gibst, kann beitreten. Das Event wird
                trotzdem nicht öffentlich im Internet
                aufgelistet.
              </small>

            </span>

            <span class="choice-check">
              ${
                w.accessMode === "public"
                  ? "✓"
                  : ""
              }
            </span>

          </button>

        </div>


        ${
          w.accessMode === "private"
            ? `
              <div class="wizard-extra visible">

                <label>
                  Zusätzliches Gäste-Passwort

                  <div class="password-wrap">

                    <input
                      id="wizGuestPassword"
                      type="password"
                      value="${esc(w.guestPassword)}"
                      placeholder="Optional – zusätzlicher Schutz">

                    <button
                      type="button"
                      class="password-toggle"
                      onclick="
                        togglePassword(
                          'wizGuestPassword',
                          this
                        )
                      ">
                      👁
                    </button>

                  </div>

                </label>

                <p class="hint">
                  Das Passwort ist optional.
                  Der sechsstellige Code bleibt der
                  normale Zugang.
                </p>

              </div>
            `
            : ""
        }
      `;
    }


    /* =====================================================
       SCHRITT 3
    ===================================================== */

    else if (state.wizardStep === 3) {

      body = `
        <span class="eyebrow">
          SCHRITT 3 VON 4
        </span>

        <h1>
          Musik
        </h1>

        <p class="muted wizard-intro">
          Jetzt legst du fest, wie eure gemeinsame
          Songauswahl funktioniert. Deine Gäste suchen
          später direkt im Spotify-Katalog.
        </p>


        <div class="wizard-section-title">
          Songs pro Gast
        </div>

        <p class="wizard-section-text">
          Wie viele Songs darf jeder Gast zur Party
          beitragen?
        </p>


        <div class="number-choice-grid">

          ${Array.from(
            {length:10},
            (_,i) => `
              <button
                type="button"
                class="number-choice ${
                  Number(w.songsPerGuest) === i + 1
                    ? "selected"
                    : ""
                }"
                onclick="selectSongLimit(${i + 1})">

                ${i + 1}

              </button>
            `
          ).join("")}

        </div>


        <div class="wizard-section-title">
          Playlist-Reihenfolge
        </div>

        <p class="wizard-section-text">
          Entscheide, ob die Songs in Eingabereihenfolge
          bleiben oder gemischt werden.
        </p>


        <div class="wizard-choice-list compact">

          <button
            type="button"
            class="wizard-choice ${
              w.playlistOrder === "chronological"
                ? "selected"
                : ""
            }"
            onclick="
              selectPlaylistOrder('chronological')
            ">

            <span class="choice-icon">
              ↕
            </span>

            <span class="choice-copy">

              <strong>
                Reihenfolge
              </strong>

              <small>
                Die Songs bleiben in der Reihenfolge,
                in der sie hinzugefügt wurden.
              </small>

            </span>

            <span class="choice-check">
              ${
                w.playlistOrder === "chronological"
                  ? "✓"
                  : ""
              }
            </span>

          </button>


          <button
            type="button"
            class="wizard-choice ${
              w.playlistOrder === "random"
                ? "selected"
                : ""
            }"
            onclick="
              selectPlaylistOrder('random')
            ">

            <span class="choice-icon">
              🔀
            </span>

            <span class="choice-copy">

              <strong>
                Zufällig
              </strong>

              <small>
                Songli mischt die Auswahl für euch
                durch.
              </small>

            </span>

            <span class="choice-check">
              ${
                w.playlistOrder === "random"
                  ? "✓"
                  : ""
              }
            </span>

          </button>

        </div>


        <div class="wizard-section-title">
          Sichtbarkeit
        </div>

        <p class="wizard-section-text">
          Bestimme, wann Gäste sehen können, welche
          Songs bereits ausgewählt wurden.
        </p>


        <div class="wizard-choice-list compact">

          <button
            type="button"
            class="wizard-choice ${
              w.revealMode === "normal"
                ? "selected"
                : ""
            }"
            onclick="
              selectRevealMode('normal')
            ">

            <span class="choice-icon">
              👀
            </span>

            <span class="choice-copy">

              <strong>
                Offen
              </strong>

              <small>
                Gäste sehen, welche Songs bereits
                ausgewählt wurden.
              </small>

            </span>

            <span class="choice-check">
              ${
                w.revealMode === "normal"
                  ? "✓"
                  : ""
              }
            </span>

          </button>


          <button
            type="button"
            class="wizard-choice ${
              w.revealMode === "after_limit"
                ? "selected"
                : ""
            }"
            onclick="
              selectRevealMode('after_limit')
            ">

            <span class="choice-icon">
              🔓
            </span>

            <span class="choice-copy">

              <strong>
                Nach eigenem Limit
              </strong>

              <small>
                Die vollständige Auswahl wird sichtbar,
                sobald ein Gast seine eigenen Songs
                ausgewählt hat.
              </small>

            </span>

            <span class="choice-check">
              ${
                w.revealMode === "after_limit"
                  ? "✓"
                  : ""
              }
            </span>

          </button>


          <button
            type="button"
            class="wizard-choice ${
              w.revealMode === "secret"
                ? "selected"
                : ""
            }"
            onclick="
              selectRevealMode('secret')
            ">

            <span class="choice-icon">
              🙈
            </span>

            <span class="choice-copy">

              <strong>
                Geheim
              </strong>

              <small>
                Nur du als Creator kannst die komplette
                Songauswahl sehen.
              </small>

            </span>

            <span class="choice-check">
              ${
                w.revealMode === "secret"
                  ? "✓"
                  : ""
              }
            </span>

          </button>

        </div>
      `;
    }


    /* =====================================================
       SCHRITT 4
    ===================================================== */

    else if (state.wizardStep === 4) {

      body = `
        <span class="eyebrow">
          SCHRITT 4 VON 4
        </span>

        <h1>
          Dein Creator-Zugang
        </h1>

        <p class="muted wizard-intro">
          Mit diesem Passwort verwaltest du später
          dein Event. Du kannst Songs und Gäste
          kontrollieren, die Playlist ansehen und
          dein Event verwalten. Deine Gäste benötigen
          dieses Passwort nicht.
        </p>


        <div class="wizard-body">

          <label>
            Creator-Passwort

            <div class="password-wrap">

              <input
                id="wizCreatorPassword"
                type="password"
                value="${esc(w.creatorPassword)}"
                minlength="4"
                placeholder="Mindestens 4 Zeichen">

              <button
                type="button"
                class="password-toggle"
                onclick="
                  togglePassword(
                    'wizCreatorPassword',
                    this
                  )
                ">
                👁
              </button>

            </div>

          </label>


          <div class="security-note">

            <span>
              🔒
            </span>

            <span>
              Dein Passwort wird serverseitig geschützt
              gespeichert und nicht im Klartext angezeigt.
            </span>

          </div>

        </div>
      `;
    }


    /* =====================================================
       SCHRITT 5
    ===================================================== */

    else {

      body = `
        <span class="eyebrow">
          EVENT BEREIT
        </span>

        <h1>
          Dein Event wird erstellt. 🎉
        </h1>

        <p class="muted wizard-intro">
          Songli erstellt gerade dein Event und
          erzeugt deinen persönlichen sechsstelligen
          Einladungscode.
        </p>


        <div
          class="glass"
          style="
            margin-top:22px;
            text-align:left
          ">

          <b>
            ${esc(w.title || "Dein Event")}
          </b>

          <p
            class="muted"
            style="margin:7px 0 0">

            ${Number(w.songsPerGuest)}
            ${
              Number(w.songsPerGuest) === 1
                ? "Song"
                : "Songs"
            }
            pro Gast
            ·
            ${
              w.accessMode === "private"
                ? "Privater Zugang"
                : "Offener Zugang"
            }

          </p>

        </div>
      `;
    }


    const actions =
      state.wizardStep < 5

        ? `
          <div class="wizard-actions">

            <button
              class="btn btn-secondary"
              onclick="wizardBack()"
              ${
                state.wizardStep === 1
                  ? 'style="visibility:hidden"'
                  : ""
              }>
              ← Zurück
            </button>


            <button
              class="btn btn-primary"
              onclick="wizardNext()">

              ${
                state.wizardStep === 4
                  ? "Event erstellen"
                  : "Weiter →"
              }

            </button>

          </div>
        `

        : `
          <div class="wizard-actions">

            <button
              class="btn btn-secondary full"
              onclick="home()">

              Zur Startseite

            </button>

          </div>
        `;


    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main center-page">

          <div class="wizard">

            <div class="steps">
              ${progress}
            </div>

            <div class="card wizard-card">

              ${body}

              ${actions}

            </div>

          </div>

        </main>

      </div>
    `;
  };


  /* =======================================================
     WIZARD NEXT
  ======================================================= */

  window.wizardNext = async function () {

    if (state.wizardStep === 1) {

      state.wizard.title =
        document.getElementById("wizTitle")
          ?.value
          .trim() || "";

      state.wizard.welcome =
        document.getElementById("wizWelcome")
          ?.value
          .trim() || "";

      state.wizard.description =
        document.getElementById("wizDescription")
          ?.value
          .trim() || "";

      if (!state.wizard.title) {
        return toast(
          "Bitte gib deinem Event einen Namen."
        );
      }
    }


    else if (state.wizardStep === 2) {

      state.wizard.guestPassword =
        document.getElementById(
          "wizGuestPassword"
        )?.value || "";
    }


    else if (state.wizardStep === 3) {

      /*
       * Die Werte werden bereits direkt beim
       * Anklicken in state.wizard gespeichert.
       */
    }


    else if (state.wizardStep === 4) {

      state.wizard.creatorPassword =
        document.getElementById(
          "wizCreatorPassword"
        )?.value || "";

      if (
        state.wizard.creatorPassword.length < 4
      ) {
        return toast(
          "Das Creator-Passwort muss mindestens 4 Zeichen haben."
        );
      }


      state.wizardStep = 5;

      renderWizard();

      try {
        await createEvent();
      } catch (_) {}

      return;
    }


    state.wizardStep++;

    renderWizard();
  };


  /* =======================================================
     6-STELLIGER EVENT-CODE
  ======================================================= */

  window.joinPrompt = function () {

    const code =
      prompt(
        "Wie lautet der 6-stellige Event-Code?"
      );

    if (!code) return;

    const cleanCode =
      code.trim();

    if (!/^\d{6}$/.test(cleanCode)) {

      return toast(
        "Bitte genau sechs Ziffern eingeben."
      );
    }

    joinPage(cleanCode);
  };


  /* =======================================================
     CREATOR LOGIN – 6 STELLEN
  ======================================================= */

  window.creatorLoginPage = function () {

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main center-page">

          <section class="card form-card">

            <span class="eyebrow">
              CREATOR
            </span>

            <h1>
              Dein Event verwalten.
            </h1>

            <p class="muted">
              Melde dich mit deinem sechsstelligen
              Event-Code und deinem Creator-Passwort an.
            </p>


            <label style="text-align:left">

              Event-Code

              <input
                id="creatorCode"
                inputmode="numeric"
                maxlength="6"
                placeholder="123456">

            </label>


            <label style="text-align:left">

              Creator-Passwort

              <div class="password-wrap">

                <input
                  id="creatorPassword"
                  type="password"
                  placeholder="Passwort">

                <button
                  type="button"
                  class="password-toggle"
                  onclick="
                    togglePassword(
                      'creatorPassword',
                      this
                    )
                  ">

                  👁

                </button>

              </div>

            </label>


            <button
              class="btn btn-primary full"
              style="margin-top:20px"
              onclick="creatorLogin()">

              Anmelden

            </button>

          </section>

        </main>

      </div>
    `;
  };


  window.creatorLogin = async function () {

    const code =
      document.getElementById(
        "creatorCode"
      )?.value.trim();

    const password =
      document.getElementById(
        "creatorPassword"
      )?.value || "";


    if (!/^\d{6}$/.test(code)) {

      return toast(
        "Bitte einen sechsstelligen Event-Code eingeben."
      );
    }


    if (!password) {

      return toast(
        "Bitte Passwort eingeben."
      );
    }


    try {

      await api(
        "/api/creator/login",
        {
          method: "POST",

          body: JSON.stringify({
            code,
            password
          })
        }
      );


      toast(
        "Erfolgreich angemeldet ✓"
      );


      setTimeout(
        () => creatorDashboard(),
        350
      );

    } catch (error) {

      toast(
        error.message
      );
    }
  };


  /* =======================================================
     START
  ======================================================= */

  songliWizardStyles();


  /*
   * Falls die Seite direkt mit
   * ?code=123456 geöffnet wurde,
   * soll der sechsstellige Code funktionieren.
   */

  const directCode =
    new URLSearchParams(
      window.location.search
    ).get("code");


  if (
    directCode &&
    /^\d{6}$/.test(
      directCode
    )
  ) {

    setTimeout(
      () => joinPage(directCode),
      0
    );
  }

})();
