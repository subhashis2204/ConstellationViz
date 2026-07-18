import { gsap } from "gsap";

const launchSite = document.querySelector(".lnchInfoCard");
const launchName = document.querySelector(".lnchInfoName");
const launchCntry = document.querySelector(".lnchInfoCntry");
const launchLat = document.querySelector(".lnchInfoLat");
const launchLng = document.querySelector(".lnchInfoLng");
const launchDesc = document.querySelector(".lnchInfoDsc");
const launchClose = document.querySelector(".close-button");

launchClose.addEventListener("click", () => {
  gsap.to(launchSite, {
    opacity: 0,
    scale: 0.9,
    duration: 0.25,
    ease: "power2.in",
    onComplete: () => {
      launchSite.classList.add("hidden");
    },
  });
});

export function LaunchStationCard(data) {
  if (!data) return;

  // Kill any active running animations to prevent glitches if user clicks rapidly

  const { name, country, lat, lng, desc } = data;

  launchName.innerText = name;
  launchCntry.innerText = country || "N/A";
  launchLat.innerText = typeof lat === "number" ? lat.toFixed(3) : lat;
  launchLng.innerText = typeof lng === "number" ? lng.toFixed(3) : lng;
  launchDesc.innerText = desc || "No operational description available";

  launchSite.classList.remove("hidden");

  gsap.to(launchSite, { opacity: 1, scale: 1, duration: 0.25, ease: "none" });
}

// // Keep track of the active timeline outside the function
// let openTimeline;

// export function LaunchStationCard(data) {
//   if (!data) return;

//   // Kill any active running animations to prevent glitches if user clicks rapidly
//   if (openTimeline) openTimeline.kill();

//   const { name, country, lat, lng, desc } = data;

//   // 1. Swap data text nodes instantly while card is invisible
//   launchName.innerText = name;
//   launchCntry.innerText = country || "N/A";
//   launchLat.innerText = typeof lat === "number" ? lat.toFixed(3) : lat;
//   launchLng.innerText = typeof lng === "number" ? lng.toFixed(3) : lng;
//   launchDesc.innerText = desc || "No operational description available";

//   // 2. Target the internal items for a beautiful cascade effect
//   const childElements = [
//     launchName,
//     launchLat,
//     launchLng,
//     launchDesc, // Selects the description text
//   ].filter(Boolean); // Filters out any missing elements gracefully

//   // 3. Reset the entry state values instantly using gsap.set
//   // This prevents layout flashing and prepares the glass for a premium slide-up
//   gsap.set(launchSite, { opacity: 0, scale: 0.98, y: 30 });
//   gsap.set(childElements, { opacity: 0, y: 15 });

//   // 4. Reveal the card container safely
//   launchSite.classList.remove("hidden");

//   // 5. Construct the clean sequence animation
//   openTimeline = gsap.timeline();

//   openTimeline
//     // Step A: Fade and float the glass container in
//     .to(launchSite, {
//       opacity: 1,
//       scale: 1,
//       y: 0,
//       duration: 0.3,
//       ease: "power3.out",
//     })
//     // Step B: Cascade reveal internal text groups right as the glass sets down
//     .to(
//       childElements,
//       {
//         opacity: 1,
//         y: 0,
//         duration: 0.25,
//         stagger: 0.1,
//         ease: "power2.out",
//       },
//       "-=0.35",
//     ); // Overlaps timeline slightly for premium fluid feel
// }
