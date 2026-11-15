import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { MyRatedSong, UserProfile } from "../api/types";
import { SongDetailModal } from "../components/SongDetailModal";

const PROFILE_STORAGE_KEY = "riffrank_profile";

type ProfileDetails = {
  displayName: string;
  avatarData: string;
  avatarContentType: string;
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const emptyProfile: ProfileDetails = { displayName: "", avatarData: "", avatarContentType: "" };

function getLargeArtworkUrl(imageUrl: string | null) {
  return imageUrl?.replace(/\/\d+x\d+bb\.(jpg|png|webp)$/i, "/600x600bb.$1") ?? null;
}

function profileFromApi(profile: UserProfile): ProfileDetails {
  return {
    displayName: profile.displayName ?? "",
    avatarData: profile.avatarData ?? "",
    avatarContentType: profile.avatarContentType ?? ""
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileDetails>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? "{}");
      return {
        displayName: typeof saved.displayName === "string" ? saved.displayName : "",
        avatarData: typeof saved.avatarData === "string" ? saved.avatarData : "",
        avatarContentType: typeof saved.avatarContentType === "string" ? saved.avatarContentType : ""
      };
    } catch {
      return emptyProfile;
    }
  });
  const [ratedSongs, setRatedSongs] = useState<MyRatedSong[]>([]);
  const [topRanks, setTopRanks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<MyRatedSong | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.auth.profile(), api.songs.myRatings(), api.songs.top()])
      .then(([savedProfile, ratings, topSongs]) => {
        setProfile(profileFromApi(savedProfile));
        setRatedSongs(ratings);
        const rankedTopSongs = [...topSongs].sort((a, b) => {
          const weighted = (b.weightedRating ?? Number.NEGATIVE_INFINITY) - (a.weightedRating ?? Number.NEGATIVE_INFINITY);
          if (weighted !== 0) return weighted;
          const votes = b.ratingCount - a.ratingCount;
          if (votes !== 0) return votes;
          return (b.actualRating ?? Number.NEGATIVE_INFINITY) - (a.actualRating ?? Number.NEGATIVE_INFINITY);
        });
        const ranks: Record<string, number> = {};
        ratings.forEach(({ song }) => {
          const index = rankedTopSongs.findIndex((topSong) =>
            topSong.id === song.id ||
            (topSong.title.toLowerCase() === song.title.toLowerCase() &&
              topSong.artistName.toLowerCase() === song.artistName.toLowerCase())
          );
          if (index >= 0) ranks[song.id] = index + 1;
        });
        setTopRanks(ranks);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const averageRating = useMemo(() => {
    if (ratedSongs.length === 0) return "—";
    return (ratedSongs.reduce((sum, entry) => sum + entry.value, 0) / ratedSongs.length).toFixed(1);
  }, [ratedSongs]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      const saved = await api.auth.updateProfile({
        displayName: profile.displayName.trim() || null,
        avatarData: profile.avatarData || null,
        avatarContentType: profile.avatarContentType || null
      });
      const nextProfile = profileFromApi(saved);
      setProfile(nextProfile);
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      window.dispatchEvent(new Event("riffrank-profile-updated"));
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile");
    }
  }

  function selectAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
      setMessage("Choose a JPEG, PNG, GIF, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setMessage("Avatar must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((current) => ({ ...current, avatarData: String(reader.result), avatarContentType: file.type }));
      setMessage(null);
    };
    reader.readAsDataURL(file);
  }

  function toExternalSong(song: MyRatedSong["song"]) {
    return {
      id: song.id,
      title: song.title,
      artistName: song.artistName,
      albumName: song.albumName,
      genre: song.genre,
      imageUrl: song.imageUrl,
      previewUrl: /\.(m4a|mp3|aac|wav|ogg)(\?|$)/i.test(song.songUrl) ? song.songUrl : null
    };
  }

  async function handleModalRate(rating: number) {
    if (!selectedSong) return;
    const { song } = selectedSong;
    await api.songs.rate(song.id, rating, {
      title: song.title,
      genre: song.genre,
      artistId: song.artistId,
      artistName: song.artistName,
      albumName: song.albumName,
      releaseYear: song.releaseYear,
      imageUrl: song.imageUrl,
      songUrl: song.songUrl
    });
    setRatedSongs((current) => current.map((entry) =>
      entry.song.id === song.id ? { ...entry, value: rating } : entry
    ));
  }

  async function handleInlineRate(entry: MyRatedSong, value: string) {
    const rating = Number(value);
    if (!rating) return;
    const { song } = entry;
    await api.songs.rate(song.id, rating, {
      title: song.title,
      genre: song.genre,
      artistId: song.artistId,
      artistName: song.artistName,
      albumName: song.albumName,
      releaseYear: song.releaseYear,
      imageUrl: song.imageUrl,
      songUrl: song.songUrl
    });
    setRatedSongs((current) => current.map((currentEntry) =>
      currentEntry.song.id === song.id ? { ...currentEntry, value: rating } : currentEntry
    ));
  }

  const initials = (profile.displayName || "You").slice(0, 2).toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-page-head">
        <div>
          <div className="top-kicker">Your RiffRank</div>
          <h1>Profile</h1>
          <p className="muted">Make your ratings feel like yours.</p>
        </div>
        <Link className="pill" to="/">← Home</Link>
      </div>

      <section className="card profile-card">
        <div className="profile-identity">
          {profile.avatarData ? (
            <img className="profile-avatar" src={profile.avatarData} alt="Profile" />
          ) : (
            <div className="profile-avatar profile-avatar-fallback" aria-hidden="true">{initials}</div>
          )}
          <div>
            <h2>{profile.displayName || "Your profile"}</h2>
            <div className="muted">Your music activity</div>
          </div>
        </div>

        <form className="profile-form" onSubmit={saveProfile}>
          <input
            value={profile.displayName}
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            placeholder="Display name"
            maxLength={40}
          />
          <label className="profile-file-input">
            <span>Profile photo</span>
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={selectAvatar} />
            <small className="muted">JPEG, PNG, GIF, or WebP · maximum 2 MB</small>
          </label>
          {profile.avatarData ? (
            <button
              className="profile-remove-photo"
              type="button"
              onClick={() => setProfile((current) => ({ ...current, avatarData: "", avatarContentType: "" }))}
            >
              Remove photo
            </button>
          ) : null}
          <button className="primary" type="submit">Save profile</button>
        </form>
        {message ? <div className="muted profile-message">{message}</div> : null}
      </section>

      <section className="profile-stats" aria-label="Rating statistics">
        <div className="card profile-stat"><span>Songs rated</span><strong>{loading ? "…" : ratedSongs.length}</strong></div>
        <div className="card profile-stat"><span>Average rating</span><strong>{loading ? "…" : `${averageRating}/10`}</strong></div>
      </section>

      <section className="card profile-ratings">
        <div className="profile-section-head">
          <div>
            <div className="top-kicker">Your history</div>
            <h2>Rated songs</h2>
          </div>
        </div>
        {loading ? <div className="muted">Loading your ratings…</div> : ratedSongs.length === 0 ? (
          <div className="muted">You have not rated any songs yet.</div>
        ) : (
          <div className="profile-rating-list">
            {ratedSongs.map((entry) => {
              const isExpanded = expandedSongId === entry.song.id;
              const artworkUrl = getLargeArtworkUrl(entry.song.imageUrl);
              return (
              <div className={`song-result profile-rating-result ${isExpanded ? "is-expanded" : ""}`} key={entry.song.id}>
                <div className="song-result-header profile-rating-result-header">
                  <div className="song-result-main">
                    {topRanks[entry.song.id] ? (
                      <span className="song-search-rank-badge">Top #{topRanks[entry.song.id]}</span>
                    ) : null}
                    <span className="song-result-title">{entry.song.title}</span>
                    <span className="song-result-meta">
                      {entry.song.artistName}
                      {entry.song.albumName ? ` · ${entry.song.albumName}` : ""}
                      {entry.song.genre ? ` · ${entry.song.genre}` : ""}
                    </span>
                    <span className="song-result-yours">You rated this {entry.value}/10</span>
                  </div>
                  <div className="song-result-rating">
                    <strong>{entry.song.actualRating?.toFixed(1) ?? "—"}</strong>
                    <span>{entry.song.ratingCount} {entry.song.ratingCount === 1 ? "vote" : "votes"}</span>
                  </div>
                  <div className="song-result-rate song-result-rate-main">
                    <select
                      value={entry.value}
                      onChange={(event) => void handleInlineRate(entry, event.target.value)}
                      aria-label={`Rate ${entry.song.title}`}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>{num}/10</option>
                      ))}
                    </select>
                  </div>
                  {artworkUrl ? (
                    <img className="song-result-thumb" src={artworkUrl} alt={entry.song.albumName || entry.song.title} />
                  ) : (
                    <span className="song-result-thumb song-result-thumb-empty" aria-hidden="true">Note</span>
                  )}
                  <button
                    type="button"
                    className="song-result-toggle"
                    onClick={() => setExpandedSongId((current) => current === entry.song.id ? null : entry.song.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? `Hide details for ${entry.song.title}` : `Show details for ${entry.song.title}`}
                  >
                    <span className="song-result-caret" aria-hidden="true">{isExpanded ? "⌃" : "⌄"}</span>
                  </button>
                </div>
                {isExpanded ? (
                  <div className="song-result-panel">
                    <div className="song-result-panel-body">
                      <div className="song-result-preview">
                        <div className="song-preview-label">Preview</div>
                        {entry.song.songUrl ? (
                          <audio controls className="song-inline-audio"><source src={entry.song.songUrl} type="audio/mpeg" /></audio>
                        ) : (
                          <div className="muted">No preview available for this song.</div>
                        )}
                      </div>
                      <div className="song-result-actions">
                        <button type="button" onClick={() => setSelectedSong(entry)}>Full details</button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedSong ? (
        <SongDetailModal
          song={toExternalSong(selectedSong.song)}
          isOpen={true}
          onClose={() => setSelectedSong(null)}
          onRate={handleModalRate}
        />
      ) : null}
    </div>
  );
}
