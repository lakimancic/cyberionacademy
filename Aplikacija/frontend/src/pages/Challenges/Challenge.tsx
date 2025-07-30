import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";

interface ChallengeDetailsData {
  id: number;
  name: string;
  description: string;
  categoryName: string;
  points: number;
  averageRating: number;
  solvedCount: number;
  difficulty: number;
  isArchived: boolean;
  isPublic: boolean;
}

const difficultyLabels = ["Very Easy", "Easy", "Medium", "Hard", "Very Hard"];

function ChallengeDetails() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<ChallengeDetailsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api
      .get(`/Challenge/GetChallengeDetails/${id}`)
      .then((res) => {
        setChallenge(res.data);
      })
      .catch((err) => {
        console.error("Greška pri dohvatanju izazova:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;

  if (!challenge) return <div>Challenge not found.</div>;

  return (
    <div style={{ padding: "1rem", color: "#fff" }}>
      <h2>{challenge.name}</h2>
      <p>
        <strong>Category:</strong> {challenge.categoryName}
      </p>
      <p>
        <strong>Points:</strong> {challenge.points}
      </p>
      <p>
        <strong>Description:</strong> {challenge.description}
      </p>
      <p>
        <strong>Difficulty:</strong> {difficultyLabels[challenge.difficulty] || "Unknown"}
      </p>
    </div>
  );
}

export default ChallengeDetails;
