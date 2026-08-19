const titles = {
  overview: "Good morning, Mahdi.",
  content: "Your content, organized.",
  media: "Media that works harder.",
  analytics: "Know what resonates."
};

document.querySelectorAll(".side-item").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.view;
    document.querySelectorAll(".side-item, .view").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(target).classList.add("active");
    document.getElementById("view-title").textContent = titles[target];
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("visible"));
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));
