/* =========================================================
   SONGLI 2.0
   ========================================================= */

const state = {
  page: "home",
  wizardStep: 1,

  wizard: {
    title: "",
    welcome: "",
    description: "",
    accessMode: "private",
    guestPassword: "",
    songsPerGuest: 3,
    revealMode: "normal",
    playlistOrder: "chronological",
    creatorPassword: ""
  },

  event: null,
  guest: null,
  creator: null,
  admin: false,

  searchTimer: null,
  toastTimer: null,

  playback: {
    player: null,
    deviceId: null,
    ready: false,
    connected: false,
    token: null,
    expiresAt: 0,
    currentTrack: null,
    position: 0,
    duration: 0,
    playing: false,
    progressTimer: null
  }
};


/* =========================================================
   HELPERS
   ========================================================= */

const $ = selector => document.querySelector(selector);

const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );

function main() {
  return $("#main");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* =========================================================
   API
   ========================================================= */

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response
    .json()
    .catch(() => ({
      ok: false,
      error: "Ungültige Serverantwort."
    }));

  if (!response.ok || data.ok === false) {
    throw new Error(
      data.error ||
      `HTTP ${response.status}`
    );
  }

  return data.data;
}


/* =========================================================
   TOAST
   ========================================================= */

function toast(message, error = false) {
  const root = $("#toast-root");

  if (!root) {
    console.error(message);
    return;
  }

  /*
   * Nicht 10 identische Fehlermeldungen gleichzeitig anzeigen.
   */
  const existing = [...root.children].find(
    el => el.textContent === String(message)
  );

  if (existing) return;

  const el = document.createElement("div");

  el.className = `toast ${error ? "error" : "success"}`;
  el.textContent = message;

  root.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 3500);
}


/* =========================================================
   APP SHELL
   ========================================================= */

function appShell() {
  return `
    <header class="topbar">

      <div class="brand" id="brandHome">
        <div class="brand-mark"></div>
        <div class="brand-name">
          Song<span>li</span>
        </div>
      </div>

      <button
        class="menu-button"
        id="menuBtn"
        aria-label="Menü öffnen"
      >
        ☰
      </button>

    </header>

    <main id="main"></main>

    <div
      id="drawerBackdrop"
      class="drawer-backdrop"
    ></div>

    <aside
      id="drawer"
      class="drawer"
      aria-hidden="true"
    >

      <div class="drawer-header">
        <h2>Songli</h2>

        <button
          class="drawer-close"
          id="drawerClose"
        >
          ×
        </button>
      </div>

      <nav class="drawer-nav">

        <button data-page="home">
          Startseite
        </button>

        <button data-page="join">
          Event beitreten
        </button>

        <button data-page="create">
          Event erstellen
        </button>

        <button data-page="creator-login">
          Creator Login
        </button>

      </nav>

      <div class="drawer-footer">
        Made by Nico
      </div>

    </aside>

    <div id="modalRoot"></div>
  `;
}


/* =========================================================
   DRAWER
   ========================================================= */

function openDrawer() {
  const drawer = $("#drawer");
  const backdrop = $("#drawerBackdrop");

  drawer?.classList.add("open");
  backdrop?.classList.add("open");
}

function closeDrawer() {
  const drawer = $("#drawer");
  const backdrop = $("#drawerBackdrop");

  drawer?.classList.remove("open");
  backdrop?.classList.remove("open");
}


/* =========================================================
   MODAL
   ========================================================= */

function modal(title, html, buttons = []) {
  const root = $("#modalRoot");

  if (!root) return;

  root.innerHTML = `
    <div class="modal-backdrop">

      <div class="modal">

        <h2>${esc(title)}</h2>

        ${html}

        ${
          buttons.length
            ? `
              <div
                class="actions"
                style="margin-top:18px;justify-content:flex-end"
              >
                ${buttons
                  .map(
                    (button, index) => `
                      <button
                        class="btn ${
                          button.primary
                            ? "primary"
                            : button.danger
                            ? "danger"
                            : ""
                        }"
                        data-modal-button="${index}"
                      >
                        ${esc(button.label)}
                      </button>
                    `
                  )
                  .join("")}
              </div>
            `
            : ""
        }

      </div>

    </div>
  `;

  buttons.forEach((button, index) => {
    const element = root.querySelector(
      `[data-modal-button="${index}"]`
    );

    if (!element) return;

    element.onclick = async () => {
      try {
        if (button.action) {
          await button.action();
        } else {
          closeModal();
        }
      } catch (error) {
        toast(error.message, true);
      }
    };
  });
}

function closeModal() {
  const root = $("#modalRoot");

  if (root) {
    root.innerHTML = "";
  }
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function setPage(page) {
  closeDrawer();

  state.page = page;

  render();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   HOME
   ========================================================= */

function homeHTML() {
  return `
    <section class="hero">

      <div class="hero-card">

        <div
          class="vinyl-wrap"
          id="vinyl"
          aria-label="Songli"
        >
          <div class="vinyl spinning"></div>
        </div>

        <h1>
          Deine Musik.
          <span>Dein Event.</span>
        </h1>

        <p>
          Erstellt ein Event, teilt den Code mit euren Freunden
          und lasst gemeinsam eure Playlist entstehen.
        </p>

        <div class="actions">

          <button
            class="btn primary"
            data-page="create"
          >
            Event erstellen
          </button>

          <button
            class="btn"
            data-page="join"
          >
            Event beitreten
          </button>

        </div>

      </div>

    </section>
  `;
}


/* =========================================================
   COMMON BINDINGS
   ========================================================= */

function bindCommon() {
  document
    .querySelectorAll("[data-page]")
    .forEach(button => {
      button.onclick = () =>
        setPage(button.dataset.page);
    });
}


/* =========================================================
   VINYL INTERACTION
   ========================================================= */

function bindVinyl() {
  const vinylWrap = $("#vinyl");

  if (!vinylWrap) return;

  let lastX = null;

  vinylWrap.onpointerdown = event => {
    lastX = event.clientX;

    vinylWrap.setPointerCapture?.(
      event.pointerId
    );
  };

  vinylWrap.onpointermove = event => {
    if (lastX === null) return;

    const delta = event.clientX - lastX;

    if (Math.abs(delta) > 2) {
      const vinyl =
        vinylWrap.querySelector(".vinyl");

      if (vinyl) {
        const speed =
          Math.max(
            0.45,
            Math.min(
              7,
              4 - delta * 0.04
            )
          );

        vinyl.style.animationDuration =
          `${speed}s`;
      }

      lastX = event.clientX;
    }
  };

  vinylWrap.onpointerup = () => {
    lastX = null;

    const vinyl =
      vinylWrap.querySelector(".vinyl");

    if (vinyl) {
      vinyl.style.animationDuration = "7s";
    }
  };
}


/* =========================================================
   CREATE EVENT
   ========================================================= */

function choice(
  group,
  value,
  selected,
  title,
  description
) {
  return `
    <div class="choice">

      <input
        type="radio"
        name="${group}"
        value="${esc(value)}"
        ${selected ? "checked" : ""}
      >

      <label
        data-choice-group="${esc(group)}"
        data-choice-value="${esc(value)}"
      >

        <span class="choice-title">
          ${esc(title)}
        </span>

        <span class="choice-description">
          ${esc(description)}
        </span>

      </label>

    </div>
  `;
}


function createHTML() {
  const wizard = state.wizard;
  const step = state.wizardStep;

  const progress = [1, 2, 3, 4, 5]
    .map(
      number => `
        <div
          class="wizard-step ${
            number === step
              ? "active"
              : number < step
              ? "done"
              : ""
          }"
        ></div>
      `
    )
    .join("");

  let content = "";


  /* STEP 1 */

  if (step === 1) {
    content = `
      <div class="page-header">

        <h1>Dein Event</h1>

        <p>
          Gib deinem Event einen Namen und
          begrüße deine Gäste.
        </p>

      </div>

      <div class="form">

        <div class="form-group">
          <label for="wizTitle">
            Eventname
          </label>

          <input
            class="input"
            id="wizTitle"
            maxlength="120"
            value="${esc(wizard.title)}"
            placeholder="z. B. Nicos Geburtstag"
          >
        </div>

        <div class="form-group">
          <label for="wizWelcome">
            Begrüßung
          </label>

          <textarea
            class="textarea"
            id="wizWelcome"
            maxlength="1000"
            placeholder="Willkommen bei meinem Event!"
          >${esc(wizard.welcome)}</textarea>
        </div>

        <div class="form-group">
          <label for="wizDescription">
            Beschreibung
          </label>

          <textarea
            class="textarea"
            id="wizDescription"
            maxlength="5000"
            placeholder="Wählt eure Lieblingssongs..."
          >${esc(wizard.description)}</textarea>
        </div>

      </div>
    `;
  }


  /* STEP 2 */

  if (step === 2) {
    content = `
      <div class="page-header">

        <h1>Zugang</h1>

        <p>
          Der 4-stellige Event-Code bleibt immer
          erforderlich.
        </p>

      </div>

      <div class="choice-grid">

        ${choice(
          "access",
          "private",
          wizard.accessMode === "private",
          "Privat",
          "Code und optionales Gäste-Passwort."
        )}

        ${choice(
          "access",
          "public",
          wizard.accessMode === "public",
          "Offen",
          "Kein zusätzliches Gäste-Passwort. Das Event bleibt nicht öffentlich durchsuchbar."
        )}

      </div>

      ${
        wizard.accessMode === "private"
          ? `
            <div class="card" style="margin-top:16px">

              <div class="form-group">

                <label for="wizGuestPassword">
                  Gäste-Passwort
                </label>

                <input
                  class="input"
                  id="wizGuestPassword"
                  type="password"
                  value="${esc(
                    wizard.guestPassword
                  )}"
                  placeholder="Optional"
                >

                <span class="field-hint">
                  Optional. Gäste benötigen dann zusätzlich
                  zum 4-stelligen Event-Code dieses Passwort.
                </span>

              </div>

            </div>
          `
          : ""
      }
    `;
  }


  /* STEP 3 */

  if (step === 3) {
    content = `
      <div class="page-header">

        <h1>Musik</h1>

        <p>
          Lege fest, wie viele Songs jeder Gast
          hinzufügen darf.
        </p>

      </div>

      <div class="form">

        <div class="form-group">

          <label for="wizLimit">
            Songs pro Gast
          </label>

          <select
            class="select"
            id="wizLimit"
          >
            ${Array
              .from({ length: 10 }, (_, index) => {
                const value = index + 1;

                return `
                  <option
                    value="${value}"
                    ${
                      wizard.songsPerGuest === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${value}
                  </option>
                `;
              })
              .join("")}
          </select>

        </div>

        <div class="form-group">

          <label for="wizOrder">
            Playlist-Reihenfolge
          </label>

          <select
            class="select"
            id="wizOrder"
          >

            <option
              value="chronological"
              ${
                wizard.playlistOrder ===
                "chronological"
                  ? "selected"
                  : ""
              }
            >
              Chronologisch
            </option>

            <option
              value="random"
              ${
                wizard.playlistOrder === "random"
                  ? "selected"
                  : ""
              }
            >
              Zufällig
            </option>

          </select>

        </div>

        <div>

          <label class="field-hint">
            Sichtbarkeit
          </label>

          <div
            class="choice-grid"
            style="margin-top:8px"
          >

            ${choice(
              "reveal",
              "normal",
              wizard.revealMode === "normal",
              "Normal",
              "Gäste sehen, wer welchen Song ausgewählt hat."
            )}

            ${choice(
              "reveal",
              "after_limit",
              wizard.revealMode === "after_limit",
              "Nach Limit",
              "Die Liste wird sichtbar, sobald der Gast sein Limit erreicht."
            )}

            ${choice(
              "reveal",
              "secret",
              wizard.revealMode === "secret",
              "Geheim",
              "Nur der Creator sieht die vollständige Liste."
            )}

          </div>

        </div>

      </div>
    `;
  }


  /* STEP 4 */

  if (step === 4) {
    content = `
      <div class="page-header">

        <h1>Creator</h1>

        <p>
          Mit diesem Passwort verwaltest du dein Event.
        </p>

      </div>

      <div class="form">

        <div class="form-group">

          <label for="wizCreatorPassword">
            Creator-Passwort
          </label>

          <input
            class="input"
            id="wizCreatorPassword"
            type="password"
            minlength="6"
            value="${esc(
              wizard.creatorPassword
            )}"
            placeholder="Mindestens 6 Zeichen"
          >

          <span class="field-hint">
            Das Passwort wird verschlüsselt gespeichert
            und nicht im Klartext angezeigt.
          </span>

        </div>

      </div>
    `;
  }


  /* STEP 5 */

  if (step === 5) {
    content = `
      <div class="page-header">

        <h1>Bereit 🎵</h1>

        <p>
          Prüfe deine Angaben und erstelle dein Event.
        </p>

      </div>

      <div class="card">

        <div class="form">

          <div>
            <span class="field-hint">
              Event
            </span>

            <strong>
              ${esc(wizard.title)}
            </strong>
          </div>

          <div>
            <span class="field-hint">
              Songs pro Gast
            </span>

            <strong>
              ${wizard.songsPerGuest}
            </strong>
          </div>

          <div>
            <span class="field-hint">
              Playlist
            </span>

            <strong>
              ${
                wizard.playlistOrder ===
                "random"
                  ? "Zufällig"
                  : "Chronologisch"
              }
            </strong>
          </div>

          <div>
            <span class="field-hint">
              Sichtbarkeit
            </span>

            <strong>
              ${
                {
                  normal: "Normal",
                  after_limit: "Nach Limit",
                  secret: "Geheim"
                }[wizard.revealMode]
              }
            </strong>
          </div>

        </div>

      </div>
    `;
  }


  return `
    <section class="page">

      <div class="wizard">

        <div class="wizard-progress">
          ${progress}
        </div>

        <div class="card">

          ${content}

          <div class="wizard-footer">

            ${
              step > 1
                ? `
                  <button
                    class="btn"
                    id="wizBack"
                  >
                    Zurück
                  </button>
                `
                : "<span></span>"
            }

            <button
              class="btn primary"
              id="wizNext"
            >
              ${
                step === 5
                  ? "Event erstellen"
                  : "Weiter"
              }
            </button>

          </div>

        </div>

      </div>

    </section>
  `;
}


function bindWizard() {
  document
    .querySelectorAll(
      "[data-choice-group]"
    )
    .forEach(label => {
      label.onclick = () => {

        const group =
          label.dataset.choiceGroup;

        const value =
          label.dataset.choiceValue;

        if (group === "access") {
          state.wizard.accessMode = value;
        }

        if (group === "reveal") {
          state.wizard.revealMode = value;
        }

        render();
      };
    });


  $("#wizBack")?.addEventListener(
    "click",
    () => {
      state.wizardStep--;

      render();
    }
  );


  $("#wizNext")?.addEventListener(
    "click",
    async () => {

      const step =
        state.wizardStep;


      if (step === 1) {

        state.wizard.title =
          $("#wizTitle").value.trim();

        state.wizard.welcome =
          $("#wizWelcome").value.trim();

        state.wizard.description =
          $("#wizDescription").value.trim();

        if (!state.wizard.title) {
          toast(
            "Bitte einen Eventnamen eingeben.",
            true
          );

          return;
        }
      }


      if (step === 2) {

        state.wizard.guestPassword =
          $("#wizGuestPassword")?.value || "";
      }


      if (step === 3) {

        state.wizard.songsPerGuest =
          Number(
            $("#wizLimit").value
          );

        state.wizard.playlistOrder =
          $("#wizOrder").value;
      }


      if (step === 4) {

        state.wizard.creatorPassword =
          $("#wizCreatorPassword")
            .value;

        if (
          state.wizard.creatorPassword.length <
          6
        ) {
          toast(
            "Das Creator-Passwort muss mindestens 6 Zeichen haben.",
            true
          );

          return;
        }
      }


      if (step < 5) {
        state.wizardStep++;

        render();

        return;
      }


      try {

        const event =
          await api(
            "/api/events",
            {
              method: "POST",

              body: JSON.stringify(
                state.wizard
              )
            }
          );

        showCreated(event);

      } catch (error) {

        toast(
          error.message,
          true
        );
      }
    }
  );
}


/* =========================================================
   JOIN
   ========================================================= */

function joinHTML() {
  return `
    <section class="page narrow">

      <div class="page-header">

        <h1>Event beitreten</h1>

        <p>
          Gib den 4-stelligen Event-Code ein.
        </p>

      </div>

      <div class="card">

        <div class="form">

          <div class="form-group">

            <label for="joinCode">
              Event-Code
            </label>

            <input
              class="input code"
              id="joinCode"
              inputmode="numeric"
              maxlength="4"
              autocomplete="off"
              placeholder="1234"
            >

          </div>

          <button
            id="joinCodeBtn"
            class="btn primary full"
          >
            Weiter
          </button>

        </div>

      </div>

    </section>
  `;
}


function bindJoin() {
  const input =
    $("#joinCode");

  input.oninput = event => {
    event.target.value =
      event.target.value
        .replace(/\D/g, "")
        .slice(0, 4);
  };


  $("#joinCodeBtn").onclick =
    () => {

      const code =
        input.value.trim();

      if (!/^\d{4}$/.test(code)) {

        toast(
          "Bitte genau vier Ziffern eingeben.",
          true
        );

        return;
      }

      loadJoin(code);
    };
}


async function loadJoin(code) {
  try {

    const event =
      await api(
        `/api/events/${code}`
      );

    state.event = event;

    main().innerHTML = `
      <section class="page narrow">

        <button
          class="back-button"
          id="joinBack"
        >
          ← Zurück
        </button>

        <div class="page-header">

          <h1>
            ${esc(event.title)}
          </h1>

          <p>
            ${esc(
              event.welcome ||
              event.description ||
              "Willkommen!"
            )}
          </p>

        </div>

        <div class="card">

          <div class="form">

            <div class="form-group">

              <label for="guestName">
                Dein Name
              </label>

              <input
                class="input"
                id="guestName"
                maxlength="80"
                placeholder="z. B. Nico"
              >

            </div>

            ${
              event.requiresGuestPassword
                ? `
                  <div class="form-group">

                    <label for="guestPassword">
                      Gäste-Passwort
                    </label>

                    <input
                      class="input"
                      id="guestPassword"
                      type="password"
                    >

                  </div>
                `
                : ""
            }

            <button
              id="guestJoinBtn"
              class="btn primary full"
            >
              Event beitreten
            </button>

          </div>

        </div>

      </section>
    `;


    $("#joinBack").onclick =
      () => setPage("join");


    $("#guestJoinBtn").onclick =
      async () => {

        try {

          const name =
            $("#guestName")
              .value
              .trim();

          const password =
            $("#guestPassword")
              ?.value || "";

          if (!name) {
            toast(
              "Bitte deinen Namen eingeben.",
              true
            );

            return;
          }


          const result =
            await api(
              `/api/events/${code}/join`,
              {
                method: "POST",

                body: JSON.stringify({
                  name,
                  password
                })
              }
            );


          state.event =
            result.event;

          state.guest = {
            guestId:
              result.guestId,

            token:
              result.token,

            name:
              result.name
          };


          state.page = "guest";

          await guestRefresh();

        } catch (error) {

          toast(
            error.message,
            true
          );
        }
      };

  } catch (error) {

    toast(
      error.message,
      true
    );
  }
}


/* =========================================================
   GUEST
   ========================================================= */

async function guestRefresh() {
  if (
    !state.event ||
    !state.guest
  ) {
    return;
  }

  try {

    const data =
      await api(
        `/api/events/${state.event.code}/me` +
        `?guestId=${encodeURIComponent(
          state.guest.guestId
        )}` +
        `&token=${encodeURIComponent(
          state.guest.token
        )}`
      );


    state.event =
      data.event;

    renderGuest(data);

  } catch (error) {

    toast(
      error.message,
      true
    );
  }
}


function renderGuest(data) {

  main().innerHTML = `
    <section class="page">

      <div class="page-header">

        <h1>
          Hallo ${esc(data.guest.name)} 👋
        </h1>

        <p>
          ${esc(data.event.title)}
        </p>

      </div>


      <div class="kpi-grid">

        <div class="kpi">
          <div class="kpi-value">
            ${data.songsUsed}/${data.event.songsPerGuest}
          </div>

          <div class="kpi-label">
            Songs verwendet
          </div>
        </div>


        <div class="kpi">
          <div class="kpi-value">
            ${data.songsRemaining}
          </div>

          <div class="kpi-label">
            Songs übrig
          </div>
        </div>

      </div>


      <div class="card">

        <div class="card-title">
          <h2>Song hinzufügen</h2>

          <span class="badge green">
            Spotify
          </span>
        </div>


        <div class="search-box">

          <span class="search-icon">
            🔎
          </span>

          <input
            class="input"
            id="songSearch"
            placeholder="Song, Künstler oder Album..."
            autocomplete="off"
          >

        </div>


        <div
          id="searchResults"
          class="song-list"
        ></div>

      </div>


      <div class="card">

        <div class="card-title">

          <h2>Playlist</h2>

          <span class="badge">
            ${data.songs.length}
          </span>

        </div>


        <div
          id="guestSongs"
          class="song-list"
        >
          ${
            data.songs.length
              ? data.songs
                  .map(guestSongHTML)
                  .join("")
              : `
                <div class="empty">

                  <strong>
                    Noch keine Songs
                  </strong>

                  Füge oben deinen ersten Song hinzu.

                </div>
              `
          }
        </div>

      </div>

    </section>
  `;


  const search =
    $("#songSearch");


  search.oninput =
    () => {

      clearTimeout(
        state.searchTimer
      );

      const query =
        search.value.trim();


      if (query.length < 2) {

        $("#searchResults")
          .innerHTML = "";

        return;
      }


      state.searchTimer =
        setTimeout(
          () => searchSongs(query),
          350
        );
    };


  document
    .querySelectorAll(
      "[data-remove-song]"
    )
    .forEach(button => {

      button.onclick =
        async () => {

          try {

            await api(
              `/api/events/${state.event.code}` +
              `/songs/${button.dataset.removeSong}` +
              `?guestId=${encodeURIComponent(
                state.guest.guestId
              )}` +
              `&token=${encodeURIComponent(
                state.guest.token
              )}`,
              {
                method: "DELETE"
              }
            );


            toast(
              "Song entfernt."
            );

            guestRefresh();

          } catch (error) {

            toast(
              error.message,
              true
            );
          }
        };
    });
}


function guestSongHTML(song) {

  const own =
    String(song.guestId) ===
    String(state.guest.guestId);


  return `
    <div class="song">

      <img
        class="song-cover"
        src="${esc(
          song.thumbnail ||
          ""
        )}"
        alt=""
        loading="lazy"
      >


      <div class="song-info">

        <div class="song-title">
          ${esc(song.title)}
        </div>

        <div class="song-artist">
          ${esc(song.artist)}
        </div>

        ${
          song.album
            ? `
              <div class="song-album">
                ${esc(song.album)}
              </div>
            `
            : ""
        }

        ${
          song.guestName
            ? `
              <div class="song-album">
                ausgewählt von
                ${esc(song.guestName)}
              </div>
            `
            : ""
        }

      </div>


      <div class="song-actions">

        ${
          own
            ? `
              <button
                class="btn small danger"
                data-remove-song="${esc(
                  song.id
                )}"
              >
                Entfernen
              </button>
            `
            : ""
        }

      </div>

    </div>
  `;
}


/* =========================================================
   SPOTIFY SEARCH
   ========================================================= */

async function searchSongs(query) {

  const results =
    $("#searchResults");

  if (!results) return;


  results.innerHTML = `
    <div class="empty">
      Suche läuft…
    </div>
  `;


  try {

    const songs =
      await api(
        `/api/spotify/search?q=${encodeURIComponent(
          query
        )}`
      );


    if (!songs.length) {

      results.innerHTML = `
        <div class="empty">
          <strong>
            Keine Treffer
          </strong>

          Versuch es mit einem anderen Suchbegriff.
        </div>
      `;

      return;
    }


    const me =
      await api(
        `/api/events/${state.event.code}/me` +
        `?guestId=${encodeURIComponent(
          state.guest.guestId
        )}` +
        `&token=${encodeURIComponent(
          state.guest.token
        )}`
      );


    results.innerHTML =
      songs
        .map(
          (song, index) =>
            searchResultHTML(
              song,
              index,
              me.songsRemaining > 0
            )
        )
        .join("");


    document
      .querySelectorAll(
        "[data-add-index]"
      )
      .forEach(button => {

        button.onclick =
          () => {

            const index =
              Number(
                button.dataset.addIndex
              );

            addSong(
              songs[index]
            );
          };
      });

  } catch (error) {

    results.innerHTML = `
      <div class="empty">
        <strong>
          Suche fehlgeschlagen
        </strong>

        ${esc(error.message)}
      </div>
    `;
  }
}


function searchResultHTML(
  song,
  index,
  canAdd
) {

  return `
    <div class="song">

      <img
        class="song-cover"
        src="${esc(
          song.thumbnail || ""
        )}"
        alt=""
        loading="lazy"
      >


      <div class="song-info">

        <div class="song-title">
          ${esc(song.title)}
        </div>

        <div class="song-artist">
          ${esc(song.artist)}
        </div>

        <div class="song-album">
          ${esc(song.album || "")}
        </div>

      </div>


      <div class="song-actions">

        <button
          class="btn small ${
            canAdd
              ? "primary"
              : ""
          }"
          data-add-index="${index}"
          ${canAdd ? "" : "disabled"}
        >
          ${
            canAdd
              ? "Hinzufügen"
              : "Limit erreicht"
          }
        </button>

      </div>

    </div>
  `;
}


async function addSong(song) {

  try {

    await api(
      `/api/events/${state.event.code}/songs`,
      {
        method: "POST",

        body: JSON.stringify({
          guestId:
            state.guest.guestId,

          token:
            state.guest.token,

          spotifyTrackId:
            song.spotifyTrackId,

          title:
            song.title,

          artist:
            song.artist,

          album:
            song.album,

          thumbnail:
            song.thumbnail,

          spotifyUrl:
            song.spotifyUrl
        })
      }
    );


    toast(
      "Song hinzugefügt 🎵"
    );


    await guestRefresh();

  } catch (error) {

    toast(
      error.message,
      true
    );
  }
}


/* =========================================================
   CREATOR LOGIN
   ========================================================= */

function creatorLoginHTML() {

  return `
    <section class="page narrow">

      <div class="page-header">

        <h1>Creator Login</h1>

        <p>
          Verwalte dein Event und steuere die Musik.
        </p>

      </div>


      <div class="card">

        <div class="form">

          <div class="form-group">

            <label for="creatorCode">
              Event-Code
            </label>

            <input
              class="input code"
              id="creatorCode"
              inputmode="numeric"
              maxlength="4"
              placeholder="1234"
            >

          </div>


          <div class="form-group">

            <label for="creatorPassword">
              Creator-Passwort
            </label>

            <input
              class="input"
              id="creatorPassword"
              type="password"
              minlength="6"
            >

          </div>


          <button
            id="creatorLoginBtn"
            class="btn primary full"
          >
            Anmelden
          </button>

        </div>

      </div>

    </section>
  `;
}


function bindCreatorLogin() {

  const code =
    $("#creatorCode");


  code.oninput =
    event => {

      event.target.value =
        event.target.value
          .replace(/\D/g, "")
          .slice(0, 4);
    };


  $("#creatorLoginBtn").onclick =
    async () => {

      const eventCode =
        code.value.trim();

      const password =
        $("#creatorPassword")
          .value;


      if (
        !/^\d{4}$/.test(
          eventCode
        )
      ) {

        toast(
          "Bitte einen 4-stelligen Event-Code eingeben.",
          true
        );

        return;
      }


      if (password.length < 6) {

        toast(
          "Das Creator-Passwort muss mindestens 6 Zeichen haben.",
          true
        );

        return;
      }


      try {

        const creator =
          await api(
            "/api/creator/login",
            {
              method: "POST",

              body: JSON.stringify({
                code: eventCode,
                password
              })
            }
          );


        state.creator =
          creator;

        localStorage.setItem(
          "songli_creator_event",
          String(
            creator.id
          )
        );


        await creatorDashboard();

      } catch (error) {

        toast(
          error.message,
          true
        );
      }
    };
}


/* =========================================================
   CREATOR DASHBOARD
   ========================================================= */

async function creatorDashboard() {

  try {

    const data =
      await api(
        `/api/creator/events/${state.creator.id}`
      );


    const event =
      data.event;


    main().innerHTML = `
      <section class="page wide">

        <div class="page-header">

          <h1>
            ${esc(event.title)}
          </h1>

          <p>
            Creator Dashboard ·
            Event-Code
            <strong>${esc(event.code)}</strong>
          </p>

        </div>


        <div class="kpi-grid">

          <div class="kpi">

            <div class="kpi-value">
              ${data.guests.length}
            </div>

            <div class="kpi-label">
              Gäste
            </div>

          </div>


          <div class="kpi">

            <div class="kpi-value">
              ${data.songs.length}
            </div>

            <div class="kpi-label">
              Songs
            </div>

          </div>


          <div class="kpi">

            <div class="kpi-value">
              ${event.songsPerGuest}
            </div>

            <div class="kpi-label">
              Songs / Gast
            </div>

          </div>


          <div class="kpi">

            <div class="kpi-value">
              ${event.playlistOrder === "random"
                ? "↗"
                : "→"}
            </div>

            <div class="kpi-label">
              ${
                event.playlistOrder === "random"
                  ? "Zufällig"
                  : "Chronologisch"
              }
            </div>

          </div>

        </div>


        <div class="dashboard-grid">

          <div class="dashboard-main">


            <!-- SPOTIFY PLAYER -->

            <div class="card">

              <div class="card-title">

                <h2>
                  Musiksteuerung
                </h2>

                <span
                  id="spotifyStatusBadge"
                  class="badge"
                >
                  Nicht verbunden
                </span>

              </div>


              <div
                id="spotifyConnect"
                class="spotify-connect"
              >

                <div class="spotify-connect-text">

                  <strong>
                    Spotify verbinden
                  </strong>

                  <span>
                    Nur der Creator benötigt Spotify.
                  </span>

                </div>


                <button
                  class="btn primary"
                  id="spotifyConnectBtn"
                >
                  Mit Spotify verbinden
                </button>

              </div>


              <div
                id="playerArea"
                style="display:none"
              >

                <div class="player-shell">

                  <div class="player-main">

                    <img
                      id="playerCover"
                      class="player-cover"
                      src=""
                      alt=""
                    >


                    <div class="player-info">

                      <div
                        id="playerTitle"
                        class="player-title"
                      >
                        Keine Wiedergabe
                      </div>

                      <div
                        id="playerArtist"
                        class="player-artist"
                      >
                        Wähle einen Song aus der Playlist.
                      </div>

                    </div>


                    <div class="player-controls">

                      <button
                        class="player-button"
                        id="playerPrevious"
                        title="Vorheriger Song"
                      >
                        ⏮
                      </button>

                      <button
                        class="player-button primary"
                        id="playerPlay"
                        title="Wiedergabe"
                      >
                        ▶
                      </button>

                      <button
                        class="player-button"
                        id="playerNext"
                        title="Nächster Song"
                      >
                        ⏭
                      </button>

                    </div>

                  </div>


                  <div class="player-progress">

                    <div
                      id="playerProgressBar"
                      class="player-progress-bar"
                    ></div>

                  </div>

                </div>

              </div>

            </div>


            <!-- PLAYLIST -->

            <div class="card">

              <div class="card-title">

                <h2>
                  Playlist
                </h2>

                <span class="badge">
                  ${data.songs.length}
                </span>

              </div>


              <div class="song-list">

                ${
                  data.songs.length
                    ? data.songs
                        .map(
                          (song, index) =>
                            creatorSongHTML(
                              song,
                              index
                            )
                        )
                        .join("")
                    : `
                      <div class="empty">

                        <strong>
                          Playlist ist leer
                        </strong>

                        Sobald Gäste Songs hinzufügen,
                        erscheinen sie hier.

                      </div>
                    `
                }

              </div>

            </div>


            <!-- GÄSTE -->

            <div class="card">

              <div class="card-title">

                <h2>
                  Gäste
                </h2>

                <span class="badge">
                  ${data.guests.length}
                </span>

              </div>


              ${
                data.guests.length
                  ? `
                    <div class="guest-list">

                      ${data.guests
                        .map(
                          guest => `
                            <div class="guest-chip">

                              <span
                                class="guest-dot"
                              ></span>

                              ${esc(
                                guest.name
                              )}

                            </div>
                          `
                        )
                        .join("")}

                    </div>
                  `
                  : `
                    <div class="empty">

                      <strong>
                        Noch keine Gäste
                      </strong>

                      Teile den 4-stelligen
                      Event-Code mit deinen Gästen.

                    </div>
                  `
              }

            </div>

          </div>


          <!-- SIDEBAR -->

          <div class="dashboard-side">

            <div class="card">

              <div class="card-title">
                <h2>
                  Event
                </h2>
              </div>


              <div class="event-code">

                <div class="event-code-label">
                  Event-Code
                </div>

                <div class="event-code-value">
                  ${esc(event.code)}
                </div>

              </div>


              <button
                class="btn primary full"
                id="creatorCopyCode"
              >
                Code kopieren
              </button>

            </div>


            <div class="card">

              <div class="card-title">

                <h2>
                  Einstellungen
                </h2>

              </div>


              <div class="form">

                <div class="form-group">

                  <label>
                    Songs pro Gast
                  </label>

                  <select
                    class="select"
                    id="creatorLimit"
                  >

                    ${Array
                      .from(
                        { length: 10 },
                        (_, index) => {

                          const value =
                            index + 1;

                          return `
                            <option
                              value="${value}"
                              ${
                                event.songsPerGuest ===
                                value
                                  ? "selected"
                                  : ""
                              }
                            >
                              ${value}
                            </option>
                          `;
                        }
                      )
                      .join("")}

                  </select>

                </div>


                <div class="form-group">

                  <label>
                    Sichtbarkeit
                  </label>

                  <select
                    class="select"
                    id="creatorReveal"
                  >

                    <option
                      value="normal"
                      ${
                        event.revealMode ===
                        "normal"
                          ? "selected"
                          : ""
                      }
                    >
                      Normal
                    </option>

                    <option
                      value="after_limit"
                      ${
                        event.revealMode ===
                        "after_limit"
                          ? "selected"
                          : ""
                      }
                    >
                      Nach Limit
                    </option>

                    <option
                      value="secret"
                      ${
                        event.revealMode ===
                        "secret"
                          ? "selected"
                          : ""
                      }
                    >
                      Geheim
                    </option>

                  </select>

                </div>


                <div class="form-group">

                  <label>
                    Reihenfolge
                  </label>

                  <select
                    class="select"
                    id="creatorOrder"
                  >

                    <option
                      value="chronological"
                      ${
                        event.playlistOrder ===
                        "chronological"
                          ? "selected"
                          : ""
                      }
                    >
                      Chronologisch
                    </option>

                    <option
                      value="random"
                      ${
                        event.playlistOrder ===
                        "random"
                          ? "selected"
                          : ""
                      }
                    >
                      Zufällig
                    </option>

                  </select>

                </div>


                <button
                  class="btn primary full"
                  id="saveCreator"
                >
                  Einstellungen speichern
                </button>

              </div>

            </div>


            <div class="card">

              <div class="card-title">
                <h2>
                  Werkzeuge
                </h2>
              </div>


              <div class="tool-grid">

                <button
                  class="tool"
                  id="csv"
                >
                  <span class="tool-icon">
                    ↓
                  </span>

                  <span class="tool-text">
                    <span class="tool-title">
                      CSV Export
                    </span>

                    <span class="tool-description">
                      Playlist exportieren
                    </span>
                  </span>
                </button>


                <button
                  class="tool"
                  id="archiveEvent"
                >
                  <span class="tool-icon">
                    ▣
                  </span>

                  <span class="tool-text">
                    <span class="tool-title">
                      Archivieren
                    </span>

                    <span class="tool-description">
                      Event schließen
                    </span>
                  </span>
                </button>


                <button
                  class="tool"
                  id="creatorLogout"
                >
                  <span class="tool-icon">
                    ↪
                  </span>

                  <span class="tool-text">
                    <span class="tool-title">
                      Abmelden
                    </span>

                    <span class="tool-description">
                      Creator verlassen
                    </span>
                  </span>
                </button>


                <button
                  class="tool"
                  id="deleteEvent"
                >
                  <span class="tool-icon">
                    ×
                  </span>

                  <span class="tool-text">
                    <span class="tool-title">
                      Event löschen
                    </span>

                    <span class="tool-description">
                      Endgültig entfernen
                    </span>
                  </span>
                </button>

              </div>

            </div>

          </div>

        </div>

      </section>
    `;


    bindCreatorDashboard(
      event,
      data
    );


    /*
     * Spotify-Status initialisieren.
     */
    initSpotifyForCreator(
      event,
      data
    );

  } catch (error) {

    toast(
      error.message,
      true
    );

    state.creator = null;

    setPage(
      "creator-login"
    );
  }
}


function creatorSongHTML(
  song,
  index
) {

  return `
    <div class="song">

      <img
        class="song-cover"
        src="${esc(
          song.thumbnail || ""
        )}"
        alt=""
        loading="lazy"
      >


      <div class="song-info">

        <div class="song-title">
          ${esc(song.title)}
        </div>

        <div class="song-artist">
          ${esc(song.artist)}
        </div>

        <div class="song-album">
          ${esc(song.guestName || "Unbekannt")}
        </div>

      </div>


      <div class="song-actions">

        <button
          class="btn small primary"
          data-play-song="${esc(
            song.spotifyTrackId
          )}"
          data-play-index="${index}"
        >
          ▶
        </button>

        <button
          class="btn small danger"
          data-csong="${esc(song.id)}"
        >
          Löschen
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   CREATOR DASHBOARD BINDINGS
   ========================================================= */

function bindCreatorDashboard(
  event,
  data
) {

  $("#creatorCopyCode").onclick =
    async () => {

      try {

        await navigator.clipboard.writeText(
          event.code
        );

        toast(
          "Event-Code kopiert."
        );

      } catch {

        toast(
          `Event-Code: ${event.code}`
        );
      }
    };


  $("#saveCreator").onclick =
    async () => {

      try {

        await api(
          `/api/creator/events/${event.id}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              songsPerGuest:
                Number(
                  $("#creatorLimit").value
                ),

              revealMode:
                $("#creatorReveal").value,

              playlistOrder:
                $("#creatorOrder").value
            })
          }
        );


        toast(
          "Einstellungen gespeichert."
        );


        await creatorDashboard();

      } catch (error) {

        toast(
          error.message,
          true
        );
      }
    };


  document
    .querySelectorAll(
      "[data-csong]"
    )
    .forEach(button => {

      button.onclick =
        async () => {

          try {

            await api(
              `/api/creator/events/${event.id}` +
              `/songs/${button.dataset.csong}`,
              {
                method: "DELETE"
              }
            );


            toast(
              "Song gelöscht."
            );


            await creatorDashboard();

          } catch (error) {

            toast(
              error.message,
              true
            );
          }
        };
    });


  document
    .querySelectorAll(
      "[data-play-song]"
    )
    .forEach(button => {

      button.onclick =
        async () => {

          const index =
            Number(
              button.dataset.playIndex
            );

          await playCreatorSong(
            data.songs,
            index
          );
        };
    });


  $("#csv").onclick =
    () => {

      location.href =
        `/api/creator/events/${event.id}/export`;
    };


  $("#archiveEvent").onclick =
    () => {

      modal(
        "Event archivieren",

        `
          <p>
            Danach können keine neuen Gäste
            mehr beitreten.
          </p>
        `,

        [
          {
            label: "Abbrechen"
          },

          {
            label: "Archivieren",
            primary: true,

            action: async () => {

              await api(
                `/api/creator/events/${event.id}/archive`,
                {
                  method: "POST"
                }
              );

              closeModal();

              toast(
                "Event archiviert."
              );

              await creatorDashboard();
            }
          }
        ]
      );
    };


  $("#creatorLogout").onclick =
    async () => {

      try {

        await api(
          "/api/creator/logout",
          {
            method: "POST"
          }
        );

      } catch {
        /*
         * Auch bei einem Logout-Fehler
         * lokal ausloggen.
         */
      }


      state.creator = null;

      localStorage.removeItem(
        "songli_creator_event"
      );


      disconnectSpotify();

      setPage(
        "creator-login"
      );
    };


  $("#deleteEvent").onclick =
    () => {

      modal(
        "Event löschen",

        `
          <div class="notice warning">
            Diese Aktion kann nicht
            rückgängig gemacht werden.
          </div>
        `,

        [
          {
            label: "Abbrechen"
          },

          {
            label: "Endgültig löschen",
            danger: true,

            action: async () => {

              await api(
                `/api/creator/events/${event.id}`,
                {
                  method: "DELETE"
                }
              );

              closeModal();

              disconnectSpotify();

              state.creator =
                null;

              localStorage.removeItem(
                "songli_creator_event"
              );

              toast(
                "Event gelöscht."
              );

              setPage(
                "home"
              );
            }
          }
        ]
      );
    };
}


/* =========================================================
   SPOTIFY PKCE
   ========================================================= */

const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state"
].join(" ");


function randomString(length = 64) {

  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const bytes =
    new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return [...bytes]
    .map(
      byte =>
        characters[
          byte % characters.length
        ]
    )
    .join("");
}


async function sha256(value) {

  const data =
    new TextEncoder().encode(
      value
    );

  return crypto.subtle.digest(
    "SHA-256",
    data
  );
}


function base64UrlEncode(buffer) {

  return btoa(
    String.fromCharCode(
      ...new Uint8Array(buffer)
    )
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}


async function spotifyClientId() {

  /*
   * server.js muss später /api/status
   * mit spotifyClientId liefern.
   */

  const status =
    await api(
      "/api/status"
    );


  if (
    !status ||
    !status.spotifyClientId
  ) {

    throw new Error(
      "Spotify Client ID ist noch nicht auf dem Server hinterlegt."
    );
  }


  return status.spotifyClientId;
}


async function connectSpotify() {

  try {

    const clientId =
      await spotifyClientId();


    const verifier =
      randomString(96);


    const challenge =
      base64UrlEncode(
        await sha256(
          verifier
        )
      );


    const stateValue =
      randomString(32);


    sessionStorage.setItem(
      "songli_spotify_verifier",
      verifier
    );

    sessionStorage.setItem(
      "songli_spotify_state",
      stateValue
    );


    const redirectUri =
      `${location.origin}/`;


    const params =
      new URLSearchParams({
        client_id:
          clientId,

        response_type:
          "code",

        redirect_uri:
          redirectUri,

        code_challenge_method:
          "S256",

        code_challenge:
          challenge,

        state:
          stateValue,

        scope:
          SPOTIFY_SCOPES
      });


    location.href =
      `https://accounts.spotify.com/authorize?${params}`;

  } catch (error) {

    toast(
      error.message,
      true
    );
  }
}


async function handleSpotifyCallback() {

  const params =
    new URLSearchParams(
      location.search
    );


  const code =
    params.get("code");

  const returnedState =
    params.get("state");

  const error =
    params.get("error");


  if (error) {

    toast(
      `Spotify-Anmeldung abgebrochen: ${error}`,
      true
    );

    history.replaceState(
      {},
      document.title,
      location.pathname
    );

    return;
  }


  if (!code) {
    return;
  }


  const savedState =
    sessionStorage.getItem(
      "songli_spotify_state"
    );

  const verifier =
    sessionStorage.getItem(
      "songli_spotify_verifier"
    );


  if (
    !savedState ||
    !verifier ||
    returnedState !== savedState
  ) {

    toast(
      "Spotify-Anmeldung konnte nicht verifiziert werden.",
      true
    );

    return;
  }


  try {

    const clientId =
      await spotifyClientId();


    const redirectUri =
      `${location.origin}/`;


    const body =
      new URLSearchParams({
        client_id:
          clientId,

        grant_type:
          "authorization_code",

        code,

        redirect_uri:
          redirectUri,

        code_verifier:
          verifier
      });


    const response =
      await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },

          body
        }
      );


    const token =
      await response.json();


    if (!response.ok) {

      throw new Error(
        token.error_description ||
        "Spotify-Token konnte nicht abgerufen werden."
      );
    }


    state.playback.token =
      token.access_token;

    state.playback.expiresAt =
      Date.now() +
      (token.expires_in * 1000);


    sessionStorage.setItem(
      "songli_spotify_refresh_token",
      token.refresh_token || ""
    );


    sessionStorage.removeItem(
      "songli_spotify_verifier"
    );

    sessionStorage.removeItem(
      "songli_spotify_state"
    );


    history.replaceState(
      {},
      document.title,
      location.pathname
    );


    toast(
      "Spotify erfolgreich verbunden 🎵"
    );


    if (state.creator) {
      await initSpotifyPlayer();
    }

  } catch (error) {

    toast(
      error.message,
      true
    );
  }
}


/* =========================================================
   SPOTIFY TOKEN
   ========================================================= */

async function getSpotifyToken() {

  if (
    state.playback.token &&
    Date.now() <
      state.playback.expiresAt -
        60000
  ) {
    return state.playback.token;
  }


  /*
   * Falls bereits ein Access Token vorhanden ist,
   * benutzen wir es solange es gültig ist.
   */
  if (state.playback.token) {
    return state.playback.token;
  }


  throw new Error(
    "Bitte zuerst Spotify verbinden."
  );
}


async function spotifyApi(
  endpoint,
  options = {}
) {

  const token =
    await getSpotifyToken();


  const response =
    await fetch(
      `https://api.spotify.com/v1${endpoint}`,
      {
        ...options,

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );


  if (response.status === 401) {

    state.playback.token =
      null;

    throw new Error(
      "Spotify-Anmeldung ist abgelaufen. Bitte erneut verbinden."
    );
  }


  const data =
    await response
      .json()
      .catch(() => null);


  if (!response.ok) {

    throw new Error(
      data?.error?.message ||
      "Spotify-Anfrage fehlgeschlagen."
    );
  }


  return data;
}


/* =========================================================
   SPOTIFY WEB PLAYBACK SDK
   ========================================================= */

async function initSpotifyForCreator() {

  const connect =
    $("#spotifyConnect");

  const button =
    $("#spotifyConnectBtn");


  if (button) {
    button.onclick =
      connectSpotify;
  }


  /*
   * Callback kann bereits erfolgreich
   * ein Token gesetzt haben.
   */
  if (
    state.playback.token
  ) {
    await initSpotifyPlayer();
  }
}


async function initSpotifyPlayer() {

  if (
    !state.playback.token
  ) {
    return;
  }


  if (
    !window.Spotify
  ) {

    await waitForSpotifySDK();
  }


  if (
    !window.Spotify
  ) {

    throw new Error(
      "Spotify Player konnte nicht geladen werden."
    );
  }


  /*
   * Nicht zweimal initialisieren.
   */
  if (
    state.playback.player
  ) {
    return;
  }


  const player =
    new Spotify.Player({
      name:
        "Songli Player",

      getOAuthToken:
        callback => {
          callback(
            state.playback.token
          );
        },

      volume:
        0.75
    });


  state.playback.player =
    player;


  player.addListener(
    "ready",
    ({ device_id }) => {

      state.playback.deviceId =
        device_id;

      state.playback.ready =
        true;

      state.playback.connected =
        true;

      updateSpotifyUI();

      toast(
        "Songli Spotify-Player ist bereit."
      );
    }
  );


  player.addListener(
    "not_ready",
    ({ device_id }) => {

      if (
        state.playback.deviceId ===
        device_id
      ) {

        state.playback.ready =
          false;
      }

      updateSpotifyUI();
    }
  );


  player.addListener(
    "player_state_changed",
    playbackState => {

      if (!playbackState) {
        return;
      }


      state.playback.position =
        playbackState.position;

      state.playback.duration =
        playbackState.duration;

      state.playback.playing =
        !playbackState.paused;


      const track =
        playbackState.track_window
          ?.current_track;


      if (track) {

        state.playback.currentTrack = {
          id:
            track.id,

          uri:
            track.uri,

          name:
            track.name,

          artists:
            track.artists
              ?.map(
                artist =>
                  artist.name
              )
              .join(", "),

          album:
            track.album
              ?.name,

          image:
            track.album
              ?.images?.[0]
              ?.url || ""
        };
      }


      updatePlayerTrack();

      updatePlayerProgress();
    }
  );


  player.addListener(
    "initialization_error",
    ({ message }) => {

      toast(
        `Spotify: ${message}`,
        true
      );
    }
  );


  player.addListener(
    "authentication_error",
    ({ message }) => {

      toast(
        `Spotify-Anmeldung: ${message}`,
        true
      );
    }
  );


  player.addListener(
    "account_error",
    ({ message }) => {

      toast(
        `Spotify: ${message}. Für Web Playback wird Spotify Premium benötigt.`,
        true
      );
    }
  );


  player.addListener(
    "playback_error",
    ({ message }) => {

      toast(
        `Spotify Wiedergabefehler: ${message}`,
        true
      );
    }
  );


  const connected =
    await player.connect();


  if (!connected) {

    throw new Error(
      "Spotify Player konnte nicht verbunden werden."
    );
  }


  updateSpotifyUI();
}


function waitForSpotifySDK(
  timeout = 8000
) {

  return new Promise(resolve => {

    const start =
      Date.now();


    const timer =
      setInterval(() => {

        if (
          window.Spotify ||
          Date.now() - start >
            timeout
        ) {

          clearInterval(timer);

          resolve();
        }

      }, 100);
  });
}


/* =========================================================
   SPOTIFY UI
   ========================================================= */

function updateSpotifyUI() {

  const connect =
    $("#spotifyConnect");

  const area =
    $("#playerArea");

  const badge =
    $("#spotifyStatusBadge");


  if (!connect || !area) {
    return;
  }


  if (
    state.playback.ready
  ) {

    connect.style.display =
      "none";

    area.style.display =
      "block";


    if (badge) {

      badge.textContent =
        "Verbunden";

      badge.className =
        "badge green";
    }

  } else {

    connect.style.display =
      "flex";

    area.style.display =
      "none";


    if (badge) {

      badge.textContent =
        "Nicht verbunden";

      badge.className =
        "badge";
    }
  }


  const play =
    $("#playerPlay");


  if (play) {

    play.textContent =
      state.playback.playing
        ? "⏸"
        : "▶";
  }
}


function updatePlayerTrack() {

  const track =
    state.playback.currentTrack;


  const title =
    $("#playerTitle");

  const artist =
    $("#playerArtist");

  const cover =
    $("#playerCover");


  if (!title || !artist) {
    return;
  }


  if (!track) {

    title.textContent =
      "Keine Wiedergabe";

    artist.textContent =
      "Wähle einen Song aus der Playlist.";

    if (cover) {
      cover.src = "";
    }

    return;
  }


  title.textContent =
    track.name ||
    "Unbekannter Song";


  artist.textContent =
    track.artists ||
    "Unbekannter Künstler";


  if (cover) {
    cover.src =
      track.image || "";
  }
}


function updatePlayerProgress() {

  const bar =
    $("#playerProgressBar");


  if (!bar) {
    return;
  }


  if (
    !state.playback.duration
  ) {

    bar.style.width =
      "0%";

    return;
  }


  const percent =
    Math.min(
      100,
      Math.max(
        0,
        state.playback.position /
          state.playback.duration *
          100
      )
    );


  bar.style.width =
    `${percent}%`;
}


/* =========================================================
   PLAYLIST PLAYBACK
   ========================================================= */

let creatorPlaylist = [];
let creatorPlaylistIndex = -1;


async function activateSpotifyPlayer() {

  if (
    !state.playback.player
  ) {
    await initSpotifyPlayer();
  }


  if (
    !state.playback.player
  ) {
    throw new Error(
      "Spotify Player ist nicht verfügbar."
    );
  }


  /*
   * Wichtig:
   * activateElement() muss aus einer
   * echten Benutzeraktion kommen.
   */
  try {

    await state.playback.player
      .activateElement();

  } catch {
    /*
     * Nicht jeder Browser unterstützt
     * diese Methode.
     */
  }
}


async function transferSpotifyPlayback() {

  const deviceId =
    state.playback.deviceId;


  if (!deviceId) {

    throw new Error(
      "Spotify Player ist noch nicht bereit."
    );
  }


  await spotifyApi(
    "/me/player",
    {
      method: "PUT",

      body: JSON.stringify({
        device_ids: [
          deviceId
        ],

        play: false
      })
    }
  );
}


async function playCreatorSong(
  songs,
  index
) {

  if (
    !songs ||
    !songs[index]
  ) {
    return;
  }


  if (
    !state.playback.token
  ) {

    toast(
      "Verbinde zuerst Spotify.",
      true
    );

    return;
  }


  try {

    creatorPlaylist =
      songs;

    creatorPlaylistIndex =
      index;


    await activateSpotifyPlayer();

    await transferSpotifyPlayback();


    const song =
      songs[index];


    if (
      !song.spotifyTrackId
    ) {

      throw new Error(
        "Für diesen Song ist keine Spotify-Track-ID gespeichert."
      );
    }


    const uri =
      `spotify:track:${song.spotifyTrackId}`;


    await spotifyApi(
      "/me/player/play",
      {
        method: "PUT",

        body: JSON.stringify({
          device_id:
            state.playback.deviceId,

          uris: [
            uri
          ]
        })
      }
    );


    state.playback.currentTrack = {
      id:
        song.spotifyTrackId,

      uri,

      name:
        song.title,

      artists:
        song.artist,

      album:
        song.album,

      image:
        song.thumbnail
    };


    updatePlayerTrack();

    toast(
      `${song.title} wird abgespielt 🎵`
    );

  } catch (error) {

    toast(
      error.message,
      true
    );
  }
}


async function togglePlayback() {

  try {

    if (
      !state.playback.player
    ) {

      throw new Error(
        "Verbinde zuerst Spotify."
      );
    }


    await activateSpotifyPlayer();


    if (
      state.playback.playing
    ) {

      await state.playback.player
        .pause();

    } else {

      await state.playback.player
        .resume();
    }

  } catch (error) {

    toast(
      error.message,
      true
    );
  }
}


async function nextSpotifySong() {

  if (
    state.playback.player
  ) {

    try {

      await state.playback.player
        .nextTrack();

      return;

    } catch {
      /*
       * Fallback auf unsere Event-Playlist.
       */
    }
  }


  if (
    creatorPlaylist.length
  ) {

    const next =
      creatorPlaylistIndex + 1;

    if (
      next <
      creatorPlaylist.length
    ) {

      await playCreatorSong(
        creatorPlaylist,
        next
      );
    }
  }
}


async function previousSpotifySong() {

  if (
    state.playback.player
  ) {

    try {

      await state.playback.player
        .previousTrack();

      return;

    } catch {
      /*
       * Fallback.
       */
    }
  }


  if (
    creatorPlaylist.length
  ) {

    const previous =
      creatorPlaylistIndex - 1;

    if (
      previous >= 0
    ) {

      await playCreatorSong(
        creatorPlaylist,
        previous
      );
    }
  }
}


function bindPlayerButtons() {

  const play =
    $("#playerPlay");

  const next =
    $("#playerNext");

  const previous =
    $("#playerPrevious");


  if (play) {
    play.onclick =
      togglePlayback;
  }


  if (next) {
    next.onclick =
      nextSpotifySong;
  }


  if (previous) {
    previous.onclick =
      previousSpotifySong;
  }
}


/* =========================================================
   DISCONNECT
   ========================================================= */

function disconnectSpotify() {

  if (
    state.playback.player
  ) {

    state.playback.player
      .disconnect()
      .catch(() => {});
  }


  state.playback.player =
    null;

  state.playback.deviceId =
    null;

  state.playback.ready =
    false;

  state.playback.connected =
    false;

  state.playback.token =
    null;

  state.playback.currentTrack =
    null;

  state.playback.playing =
    false;
}


/* =========================================================
   ADMIN
   ========================================================= */

function adminLogin() {

  main().innerHTML = `
    <section class="page narrow">

      <div class="page-header">

        <h1>
          Admin
        </h1>

        <p>
          Verwaltungszugang.
        </p>

      </div>


      <div class="card">

        <div class="form">

          <div class="form-group">

            <label>
              Benutzername
            </label>

            <input
              class="input"
              id="adminUser"
              autocomplete="username"
            >

          </div>


          <div class="form-group">

            <label>
              Passwort
            </label>

            <input
              class="input"
              id="adminPass"
              type="password"
              autocomplete="current-password"
            >

          </div>


          <button
            id="adminLogin"
            class="btn primary full"
          >
            Anmelden
          </button>

        </div>

      </div>

    </section>
  `;


  $("#adminLogin").onclick =
    async () => {

      try {

        await api(
          "/api/admin/login",
          {
            method: "POST",

            body: JSON.stringify({
              username:
                $("#adminUser").value,

              password:
                $("#adminPass").value
            })
          }
        );


        state.admin =
          true;

        await adminDashboard();

      } catch (error) {

        toast(
          error.message,
          true
        );
      }
    };
}


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

async function adminDashboard() {

  try {

    const events =
      await api(
        "/api/admin/events"
      );


    main().innerHTML = `
      <section class="page wide">

        <div class="page-header">

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Plattformverwaltung.
          </p>

        </div>


        <div class="card">

          <div class="card-title">

            <h2>
              Events
            </h2>

            <span class="badge">
              ${events.length}
            </span>

          </div>


          ${
            events.length
              ? `
                <div class="song-list">

                  ${events
                    .map(
                      event => `
                        <div class="admin-event">

                          <div>

                            <div class="admin-event-title">
                              ${esc(event.title)}
                            </div>

                            <div class="admin-event-meta">
                              Code ${esc(event.code)}
                              · ${event.guestCount} Gäste
                              · ${event.songCount} Songs
                            </div>

                          </div>


                          <div class="actions">

                            <button
                              class="btn small"
                              data-a-view="${event.id}"
                            >
                              Öffnen
                            </button>

                            <button
                              class="btn small"
                              data-a-reset="${event.id}"
                            >
                              Passwort resetten
                            </button>

                            <button
                              class="btn small"
                              data-a-archive="${event.id}"
                            >
                              Archivieren
                            </button>

                            <button
                              class="btn small danger"
                              data-a-delete="${event.id}"
                            >
                              Löschen
                            </button>

                          </div>

                        </div>
                      `
                    )
                    .join("")}

                </div>
              `
              : `
                <div class="empty">

                  <strong>
                    Keine Events
                  </strong>

                  Es wurden noch keine Events erstellt.

                </div>
              `
          }

        </div>


        <button
          id="adminLogout"
          class="btn"
        >
          Abmelden
        </button>

      </section>
    `;


    document
      .querySelectorAll(
        "[data-a-view]"
      )
      .forEach(button => {

        button.onclick =
          () =>
            adminEvent(
              button.dataset.aView
            );
      });


    document
      .querySelectorAll(
        "[data-a-reset]"
      )
      .forEach(button => {

        button.onclick =
          () => {

            modal(
              "Creator-Passwort zurücksetzen",

              `
                <p>
                  Das bisherige Creator-Passwort
                  wird ungültig.
                </p>
              `,

              [
                {
                  label:
                    "Abbrechen"
                },

                {
                  label:
                    "Zurücksetzen",

                  primary:
                    true,

                  action:
                    async () => {

                      const result =
                        await api(
                          `/api/admin/events/${button.dataset.aReset}/reset-creator-password`,
                          {
                            method:
                              "POST"
                          }
                        );


                      closeModal();


                      modal(
                        "Neues Creator-Passwort",

                        `
                          <div class="notice accent">

                            <strong>
                              Temporäres Passwort
                            </strong>

                            <p>
                              ${esc(
                                result.temporaryPassword
                              )}
                            </p>

                          </div>
                        `,

                        [
                          {
                            label:
                              "Schließen"
                          }
                        ]
                      );
                    }
                }
              ]
            );
          };
      });


    document
      .querySelectorAll(
        "[data-a-archive]"
      )
      .forEach(button => {

        button.onclick =
          async () => {

            try {

              await api(
                `/api/admin/events/${button.dataset.aArchive}/archive`,
                {
                  method:
                    "POST"
                }
              );

              toast(
                "Event archiviert."
              );

              await adminDashboard();

            } catch (error) {

              toast(
                error.message,
                true
              );
            }
          };
      });


    document
      .querySelectorAll(
        "[data-a-delete]"
      )
      .forEach(button => {

        button.onclick =
          () => {

            modal(
              "Event löschen",

              `
                <div class="notice warning">
                  Das Event und seine Daten
                  werden endgültig gelöscht.
                </div>
              `,

              [
                {
                  label:
                    "Abbrechen"
                },

                {
                  label:
                    "Löschen",

                  danger:
                    true,

                  action:
                    async () => {

                      await api(
                        `/api/admin/events/${button.dataset.aDelete}`,
                        {
                          method:
                            "DELETE"
                        }
                      );


                      closeModal();

                      toast(
                        "Event gelöscht."
                      );

                      await adminDashboard();
                    }
                }
              ]
            );
          };
      });


    $("#adminLogout").onclick =
      async () => {

        try {

          await api(
            "/api/admin/logout",
            {
              method:
                "POST"
            }
          );

        } catch {
          /*
           * Lokal trotzdem ausloggen.
           */
        }


        state.admin =
          false;

        setPage(
          "home"
        );
      };

  } catch (error) {

    toast(
      error.message,
      true
    );

    adminLogin();
  }
}


/* =========================================================
   ADMIN EVENT
   ========================================================= */

async function adminEvent(id) {

  try {

    const data =
      await api(
        `/api/admin/events/${id}`
      );


    main().innerHTML = `
      <section class="page wide">

        <button
          class="back-button"
          id="adminBack"
        >
          ← Zurück
        </button>


        <div class="page-header">

          <h1>
            ${esc(data.event.title)}
          </h1>

          <p>
            Event-Code:
            <strong>
              ${esc(data.event.code)}
            </strong>
          </p>

        </div>


        <div class="dashboard-grid">

          <div class="card">

            <div class="card-title">
              <h2>
                Gäste
              </h2>

              <span class="badge">
                ${data.guests.length}
              </span>
            </div>


            ${
              data.guests.length
                ? `
                  <div class="guest-list">

                    ${data.guests
                      .map(
                        guest => `
                          <div class="guest-chip">

                            <span
                              class="guest-dot"
                            ></span>

                            ${esc(
                              guest.name
                            )}

                          </div>
                        `
                      )
                      .join("")}

                  </div>
                `
                : `
                  <div class="empty">
                    Keine Gäste.
                  </div>
                `
            }

          </div>


          <div class="card">

            <div class="card-title">
              <h2>
                Songs
              </h2>

              <span class="badge">
                ${data.songs.length}
              </span>
            </div>


            ${
              data.songs.length
                ? `
                  <div class="song-list">

                    ${data.songs
                      .map(
                        song => `
                          <div class="song">

                            <img
                              class="song-cover"
                              src="${esc(
                                song.thumbnail || ""
                              )}"
                              alt=""
                            >

                            <div
                              class="song-info"
                            >

                              <div
                                class="song-title"
                              >
                                ${esc(
                                  song.title
                                )}
                              </div>

                              <div
                                class="song-artist"
                              >
                                ${esc(
                                  song.artist
                                )}
                              </div>

                              <div
                                class="song-album"
                              >
                                ${esc(
                                  song.guestName
                                )}
                              </div>

                            </div>

                          </div>
                        `
                      )
                      .join("")}

                  </div>
                `
                : `
                  <div class="empty">
                    Keine Songs.
                  </div>
                `
            }

          </div>

        </div>

      </section>
    `;


    $("#adminBack").onclick =
      adminDashboard;

  } catch (error) {

    toast(
      error.message,
      true
    );
  }
}


/* =========================================================
   EVENT CREATED
   ========================================================= */

function showCreated(data) {

  main().innerHTML = `
    <section class="page narrow">

      <div class="card">

        <div class="badge green">
          Event erstellt
        </div>


        <div class="page-header">
          <h1>
            Dein Event ist bereit! 🎉
          </h1>

          <p>
            Teile den Code mit deinen Gästen.
          </p>
        </div>


        <div class="event-code">

          <div class="event-code-label">
            4-stelliger Event-Code
          </div>

          <div class="event-code-value">
            ${esc(data.code)}
          </div>

        </div>


        <div class="actions">

          <button
            id="copyCode"
            class="btn"
          >
            Code kopieren
          </button>

          <button
            id="share"
            class="btn"
          >
            Event teilen
          </button>

          <button
            id="openEvent"
            class="btn primary"
          >
            Event öffnen
          </button>

        </div>

      </div>

    </section>
  `;


  $("#copyCode").onclick =
    async () => {

      try {

        await navigator.clipboard
          .writeText(
            data.code
          );

        toast(
          "Code kopiert."
        );

      } catch {

        toast(
          `Code: ${data.code}`
        );
      }
    };


  $("#share").onclick =
    async () => {

      const url =
        `${location.origin}/?event=${data.code}`;


      try {

        if (
          navigator.share
        ) {

          await navigator.share({
            title:
              data.title ||
              "Songli Event",

            text:
              `Komm zu meinem Songli Event: ${data.title || ""}`,

            url
          });

        } else {

          await navigator.clipboard
            .writeText(url);

          toast(
            "Einladungslink kopiert."
          );
        }

      } catch {
        /*
         * Benutzer hat Teilen abgebrochen.
         */
      }
    };


  $("#openEvent").onclick =
    () =>
      loadJoin(
        data.code
      );
}


/* =========================================================
   RENDER
   ========================================================= */

function render() {

  const target =
    main();

  if (!target) {
    return;
  }


  if (
    state.page === "home"
  ) {

    target.innerHTML =
      homeHTML();

    bindCommon();
    bindVinyl();

    return;
  }


  if (
    state.page === "create"
  ) {

    target.innerHTML =
      createHTML();

    bindCommon();
    bindWizard();

    return;
  }


  if (
    state.page === "join"
  ) {

    target.innerHTML =
      joinHTML();

    bindCommon();
    bindJoin();

    return;
  }


  if (
    state.page === "creator-login"
  ) {

    target.innerHTML =
      creatorLoginHTML();

    bindCommon();
    bindCreatorLogin();

    return;
  }


  if (
    state.page === "guest"
  ) {

    guestRefresh();

    return;
  }


  if (
    state.page === "admin"
  ) {

    adminDashboard();

    return;
  }
}


/* =========================================================
   GLOBAL EVENTS
   ========================================================= */

function bindGlobalUI() {

  $("#brandHome").onclick =
    () => setPage("home");


  $("#menuBtn").onclick =
    openDrawer;


  $("#drawerClose").onclick =
    closeDrawer;


  $("#drawerBackdrop").onclick =
    closeDrawer;


  document
    .querySelectorAll(
      "[data-page]"
    )
    .forEach(button => {

      button.onclick =
        () => {

          setPage(
            button.dataset.page
          );
        };
    });


  /*
   * "Made by Nico" zweimal schnell antippen.
   */
  const footer =
    document.querySelector(
      ".drawer-footer"
    );


  let taps = 0;
  let timer = null;


  footer?.addEventListener(
    "click",
    () => {

      taps++;

      clearTimeout(
        timer
      );


      timer =
        setTimeout(
          () => {
            taps = 0;
          },
          700
        );


      if (taps >= 2) {

        taps = 0;

        closeDrawer();

        adminLogin();
      }
    }
  );
}


/* =========================================================
   PLAYER BUTTONS
   ========================================================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-page]"
      );


    if (
      button &&
      button.dataset.page
    ) {

      setPage(
        button.dataset.page
      );
    }
  }
);


/* =========================================================
   STARTUP
   ========================================================= */

async function startup() {

  /*
   * index.html enthält zunächst nur #app.
   */
  const app =
    $("#app");


  if (app) {

    app.innerHTML =
      appShell();
  }


  bindGlobalUI();


  /*
   * Spotify OAuth Callback prüfen.
   */
  await handleSpotifyCallback();


  /*
   * Startseite.
   */
  render();


  /*
   * Direktlink:
   * https://songli.../?event=1234
   */
  const params =
    new URLSearchParams(
      location.search
    );


  const eventCode =
    params.get("event");


  if (
    eventCode &&
    /^\d{4}$/.test(
      eventCode
    )
  ) {

    await loadJoin(
      eventCode
    );
  }


  /*
   * Creator-Session nach Reload wiederherstellen,
   * sofern der Server die Session noch kennt.
   */
  const creatorEventId =
    localStorage.getItem(
      "songli_creator_event"
    );


  if (
    creatorEventId
  ) {

    try {

      const creator =
        await api(
          `/api/creator/events/${creatorEventId}`
        );


      if (
        creator?.event
      ) {

        /*
         * Wir kennen die Creator-ID
         * aus der bestehenden Session.
         */
        state.creator = {
          id:
            creator.event.id
        };

        await creatorDashboard();
      }

    } catch {
      /*
       * Keine gültige Creator-Session.
       */
      localStorage.removeItem(
        "songli_creator_event"
      );
    }
  }
}


window.addEventListener(
  "load",
  startup
);
