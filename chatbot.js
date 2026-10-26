
(() => {
  // Prevent duplicate initialization if this script is loaded twice.
  if (window.__portfolioChatInitialized) return;
  window.__portfolioChatInitialized = true;

  const form = document.getElementById("chatForm");
  const input = document.getElementById("userInput");
  const messages = document.getElementById("chatMessages");
  const statusText = document.getElementById("chatStatus");
  const sendButton = document.getElementById("sendButton");

  if (!form || !input || !messages || !statusText || !sendButton) {
    console.error("Chatbot initialization failed: required HTML elements are missing.");
    return;
  }

  const conversationHistory = [];
  let isSending = false;

  function showMessage(text, kind) {
    const p = document.createElement("p");
    p.className =
      kind === "user" ? "chat-message chat-user" : "chat-message chat-assistant";
    p.textContent = text;
    messages.appendChild(p);
    messages.scrollTop = messages.scrollHeight;
  }

  function getPortfolioContext() {
    return ["#about", "#skills", "#projects"]
      .map((selector) => {
        const section = document.querySelector(selector);
        if (!section) return "";

        const copy = section.cloneNode(true);

        copy.querySelectorAll("li").forEach((item) => {
          if (/placeholder/i.test(item.textContent)) {
            item.remove();
          }
        });

        return copy.innerText.replace(/\s+/g, " ").trim();
      })
      .filter(Boolean)
      .join("\n\n");
  }

  function isSimpleGreeting(text) {
    return /^(hi|hello|hey|hii|hiii|yo|good morning|good afternoon|good evening|howdy)[!.?,\s]*$/i
      .test(text.trim());
  }

  function saveHistory(question, answer) {
    conversationHistory.push(
      { role: "user", content: question },
      { role: "assistant", content: answer }
    );

    // Keep only the latest user/assistant pair.
    if (conversationHistory.length > 2) {
      conversationHistory.splice(0, conversationHistory.length - 2);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSending) return;

    const question = input.value.trim();

    if (!question) {
      statusText.textContent = "Please type a question.";
      return;
    }

    isSending = true;
    sendButton.disabled = true;

    showMessage(question, "user");
    input.value = "";

    if (isSimpleGreeting(question)) {
      const greeting =
        "Hi! 👋 Ask me about my skills, projects, or background.";

      showMessage(greeting, "bot");
      saveHistory(question, greeting);
      statusText.textContent = "";

      isSending = false;
      sendButton.disabled = false;
      return;
    }

    statusText.textContent = "Thinking...";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          portfolioContext: getPortfolioContext(),
          history: conversationHistory.slice(-2),
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Chat API is not available. Use the classroom demo server, or try a greeting like “hi”."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Chat request failed (${response.status}).`
        );
      }

      const answer = data.answer;

      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("The AI returned an empty answer.");
      }

      saveHistory(question, answer);

      // Display the AI answer exactly once.
      showMessage(answer, "bot");
      statusText.textContent = "";
    } catch (error) {
      console.error("Chat error:", error);
      statusText.textContent =
        error.message || "Chat unavailable. Please try again.";
    } finally {
      isSending = false;
      sendButton.disabled = false;
    }
  });
})();