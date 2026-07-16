import { matchScore, matchReason, passesLevelGate, Volunteer, Opportunity, Zone } from "@/lib/matching";

//fake_data(swap_later)
const fakeVolunteer: Volunteer = {
  name: "Rina Putri",
  faculty: "nursing",
  education_level: "undergrad",
  interests: ["maternal_child", "nutrition"],
  lat: -6.4025,
  lng: 106.7942,
};

const fakeZones: Zone[] = [
  { id: "z1", name: "Depok Priority Zone", community_health_score: 0.2 },
  { id: "z2", name: "South Jakarta", community_health_score: 0.7 },
];

const fakeOpportunities: Opportunity[] = [
  {
    title: "Child Growth Monitoring — Posyandu Melati",
    category: "maternal_child",
    faculties_wanted: ["nursing", "medicine"],
    lat: -6.3728,
    lng: 106.8317,
    slots_total: 5,
    slots_filled: 2,
    zone_id: "z1",
    min_level: null,
  },
  {
    title: "IV Line & Wound Care Shadowing — RSCM",
    category: "chronic_disease",
    faculties_wanted: ["medicine", "nursing"],
    lat: -6.2444,
    lng: 106.7991,
    slots_total: 2,
    slots_filled: 0,
    zone_id: "z2",
    min_level: "med_student",
  },
];

export async function GET() {
  const results = fakeOpportunities
    .filter((opp) => passesLevelGate(fakeVolunteer, opp))
    .map((opp) => {
      const { score, priority, breakdown } = matchScore(fakeVolunteer, opp, fakeZones);
      return {
        ...opp,
        match_score: score,
        match_reason: matchReason(fakeVolunteer, opp),
        distance_km: breakdown.km,
        priority,
      };
    })
    .sort((a, b) => b.match_score - a.match_score);

  return Response.json(results);
}