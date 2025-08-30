import { useEffect, useState } from "react";
import DataTable from "@/components/Table/DataTable";
import gold from "@/assets/images/ranks/gold.png";
import silver from "@/assets/images/ranks/silver.png";
import bronze from "@/assets/images/ranks/bronze.png";
import AuthImage from "@/components/AuthImage/AuthImage";
import { Avatar } from "@mui/material";
import api from "@/lib/api";
import { useNavigate } from "react-router-dom";
import countriesMap from "@/assets/data/countries_map.json";
import "./Scoreboard.css";
import { FaUsers } from "react-icons/fa";
import { IoMdArrowRoundBack } from "react-icons/io";

type UserData = {
  rankNum: number;
  rank: string;
  username: string;
  country?: string;
  id: number;
  totalPoints: number;
};

type CountryData = {
  country: string;
  points: number;
  rankNum: number;
  users: number;
};

const thropies = [gold, silver, bronze];

function Scoreboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [users, setUsers] = useState<UserData[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [currentCountry, setCurrentCountry] = useState<CountryData | null>(
    null
  );
  const [countryUsers, setCountryUsers] = useState<UserData[]>([]);
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    await api
      .get("/Scoreboard/", { params: { page: currentPage } })
      .then((resp) => {
        setTotalPages(resp.data.totalPages);
        setUsers(resp.data.users);
      });
  };

  const fetchCountries = async () => {
    await api
      .get("/Scoreboard/Countries", { params: { page: currentPage } })
      .then((resp) => {
        setTotalPages(resp.data.totalPages);
        setCountries(resp.data.countries);
      });
  };

  const fetchCountryUsers = async () => {
    if (!currentCountry) return;

    await api
      .get("/Scoreboard/", {
        params: { country: currentCountry.country, page: currentPage },
      })
      .then((resp) => {
        setTotalPages(resp.data.totalPages);
        setCountryUsers(resp.data.users);
      });
  };

  const changeTab = (newTab: number) => {
    if (newTab === tab) return;

    setTab(newTab);
    setCurrentPage(1);
    setTotalPages(1);
    setCurrentCountry(null);
    if (newTab === 0) {
      setUsers([]);
      fetchUsers();
    } else {
      setCountries([]);
      fetchCountries();
    }
  };

  useEffect(() => {
    if (!currentCountry) return;

    setCurrentPage(1);
    setTotalPages(1);
    setCountryUsers([]);

    fetchCountryUsers();
  }, [currentCountry]);

  useEffect(() => {
    setCurrentPage(1);

    fetchUsers();
  }, []);

  return (
    <div className="scoreboard">
      <h1>
        Cyberion<span>Leaderboard</span>
      </h1>
      <div className="scoreboard-tabs">
        <div className="scoreboard-tab" onClick={() => changeTab(0)}>
          Users Ranking
        </div>
        <div className="scoreboard-tab" onClick={() => changeTab(1)}>
          Countries Ranking
        </div>
        <div
          className="scoreboard-tab-active"
          style={{ left: `${13.3 + 43.3 * tab}%` }}
        ></div>
      </div>
      <div className="scoreboard-content">
        {tab === 0 && (
          <DataTable
            data={users.map((user) => {
              return {
                ranking: (
                  <div className="score-ranking">
                    {user.rankNum <= 3 ? (
                      <img src={thropies[user.rankNum - 1]} />
                    ) : (
                      `#${user.rankNum}`
                    )}
                  </div>
                ),
                user: (
                  <div className="score-user">
                    <AuthImage
                      src={`/User/${user.id}/ProfilePicture`}
                      element={Avatar}
                    />
                    <span>{user.username}</span>
                  </div>
                ),
                rank: <div className="score-rank">{user.rank}</div>,
                points: (
                  <div className="score-points">{user.totalPoints}pts</div>
                ),
                id: user.id,
              };
            })}
            columns={[
              { key: "ranking", header: "#" },
              { key: "user", header: "User" },
              { key: "rank", header: "Rank" },
              { key: "points", header: "Points" },
            ]}
            pagination={{
              page: currentPage,
              totalPages: totalPages,
              setPage: setCurrentPage,
            }}
            onRowClick={(row) => navigate(`/user/${row.id}`)}
          />
        )}
        {tab === 1 && !currentCountry && (
          <DataTable
            data={countries.map((country) => {
              return {
                ranking: (
                  <div className="score-ranking">
                    {country.rankNum <= 3 ? (
                      <img src={thropies[country.rankNum - 1]} />
                    ) : (
                      `#${country.rankNum}`
                    )}
                  </div>
                ),
                country: (
                  <div className="score-user">
                    <Avatar
                      src={`https://flagcdn.com/w160/${country.country}.png`}
                    />
                    <span>
                      {(countriesMap as any)[country.country] ?? "Unknown"}
                    </span>
                  </div>
                ),
                users: (
                  <div className="score-users">
                    {country.users} <FaUsers />
                  </div>
                ),
                points: <div className="score-points">{country.points}pts</div>,
                code: country.country,
              };
            })}
            columns={[
              { key: "ranking", header: "#" },
              { key: "country", header: "Country" },
              { key: "users", header: "Ranked Users" },
              { key: "points", header: "Points" },
            ]}
            pagination={{
              page: currentPage,
              totalPages: totalPages,
              setPage: setCurrentPage,
            }}
            onRowClick={(_, i) => setCurrentCountry(countries[i])}
          />
        )}
        {tab === 1 && currentCountry && (
          <div className="score-country-con">
            <IoMdArrowRoundBack
              className="admin-back"
              onClick={() => setCurrentCountry(null)}
            />
            <div className="score-country">
              <Avatar
                src={`https://flagcdn.com/w160/${currentCountry.country}.png`}
              />
              <div className="score-country-info">
                <h2>
                  {(countriesMap as any)[currentCountry.country] ?? "Unknown"}
                </h2>
                <p>Ranking: #{currentCountry.rankNum}</p>
                <p>{currentCountry.points}pts</p>
              </div>
            </div>
            <DataTable
              data={countryUsers.map((user) => {
                return {
                  ranking: (
                    <div className="score-ranking">
                      {user.rankNum <= 3 ? (
                        <img src={thropies[user.rankNum - 1]} />
                      ) : (
                        `#${user.rankNum}`
                      )}
                    </div>
                  ),
                  user: (
                    <div className="score-user">
                      <AuthImage
                        src={`/User/${user.id}/ProfilePicture`}
                        element={Avatar}
                      />
                      <span>{user.username}</span>
                    </div>
                  ),
                  rank: <div className="score-rank">{user.rank}</div>,
                  points: (
                    <div className="score-points">{user.totalPoints}pts</div>
                  ),
                  id: user.id,
                };
              })}
              columns={[
                { key: "ranking", header: "#" },
                { key: "user", header: "User" },
                { key: "rank", header: "Rank" },
                { key: "points", header: "Points" },
              ]}
              pagination={{
                page: currentPage,
                totalPages: totalPages,
                setPage: setCurrentPage,
              }}
              onRowClick={(row) => navigate(`/user/${row.id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Scoreboard;
