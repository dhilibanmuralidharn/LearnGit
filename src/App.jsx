import "./App.css";
import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [countries, setCountries] = useState([]);
  const [addedCountries, setAddedCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  //add extra state
  const [selected, setSelected] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [calculatedTimes, setCalculatedTimes] = useState([]);
  const [formData, setFormData] = useState({
    countryName: "",
    timeZone: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch countries from API
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://restcountries.com/v3.1/all?fields=name,flags,"
        );
        console.log(response.data);
        const countriesData = response.data.map((country) => ({
          name: country.name.common,
          flag: country.flags.svg || country.flags.png,
        }));
        setCountries(countriesData);
      } catch (error) {
        console.error("Error fetching countries:", error);
        setErrors((prev) => ({
          ...prev,
          fetchError: "Failed to fetch countries. Please try again.",
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    // Validate country name
    if (!formData.countryName.trim()) {
      newErrors.countryName = "Country name is required";
    } else {
      const countryExists = countries.some(
        (country) =>
          country.name.toLowerCase() === formData.countryName.toLowerCase()
      );
      if (!countryExists) {
        newErrors.countryName = "Country not found in our database";
      }
    }

    // Validate timezone
    if (!formData.timeZone.trim()) {
      newErrors.timeZone = "Timezone is required (e.g., UTC+5:30)";
    } else if (!/^UTC[+-]\d{1,2}(:\d{2})?$/.test(formData.timeZone)) {
      newErrors.timeZone = "Timezone format should be like UTC+5:30 or UTC-3";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add country to list
  const handleAddCountry = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const countryData = countries.find(
      (country) =>
        country.name.toLowerCase() === formData.countryName.toLowerCase()
    );

    if (countryData) {
      const newCountry = {
        ...countryData,
        addedTimeZone: formData.timeZone,
        id: Date.now(),
      };

      setAddedCountries((prev) => [...prev, newCountry]);
      setFormData({ countryName: "", timeZone: "" });
      setErrors({});

      // If this is the first country, auto-select it
      if (addedCountries.length === 0) {
        setSelectedCountry(newCountry.id.toString());
      }
    }
  };

  // Calculate times for all added countries
  const calculateTimes = () => {
    if (!selectedCountry || !selectedTime) {
      setErrors((prev) => ({
        ...prev,
        calculation: "Please select a country and enter time",
      }));
      return;
    }

    const baseCountry = addedCountries.find(
      (country) => country.id.toString() === selectedCountry
    );
    if (!baseCountry) return;

    const baseTimezoneOffset = parseTimezoneOffset(baseCountry.addedTimeZone);
    const baseTime = new Date(`1970-01-01T${selectedTime}:00Z`);

    const calculated = addedCountries.map((country) => {
      const countryOffset = parseTimezoneOffset(country.addedTimeZone);
      const timeDiff = countryOffset - baseTimezoneOffset;
      const newTime = new Date(baseTime.getTime() + timeDiff * 60 * 60 * 1000);

      return {
        country: country.name,
        flag: country.flag,
        time: newTime.toISOString().substr(11, 5),
        timeZone: country.addedTimeZone,
      };
    });

    setCalculatedTimes(calculated);
    setErrors((prev) => ({ ...prev, calculation: "" }));
  };

  // Helper function to parse timezone offset
  const parseTimezoneOffset = (timezone) => {
    const match = timezone.match(/UTC([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!match) return 0;

    const [, sign, hours, minutes] = match;
    let offset = parseInt(hours);
    if (minutes) {
      offset += parseInt(minutes) / 60;
    }
    return sign === "+" ? offset : -offset;
  };

  // Filter countries for display
  const filteredCountries = searchTerm
    ? countries.filter((country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : countries;

  return (
    <div className="app">
      <header className="header">
        <h1>🌍 World Time Calculator</h1>
      </header>

      <div className="container">
        {/* Section 1: Available Countries */}
        <section className="section">
          <h2>Available Countries & Flags</h2>
          {loading ? (
            <div className="loading">Loading countries...</div>
          ) : errors.fetchError ? (
            <div className="error-message">{errors.fetchError}</div>
          ) : (
            <>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="countries-grid">
                {filteredCountries.slice(0, 20).map((country, index) => (
                  <div key={index} className="country-card">
                    <img
                      src={country.flag}
                      alt={`${country.name} flag`}
                      className="country-flag"
                    />
                    <div className="country-info">
                      <h4>{country.name}</h4>
                      {/* <p className="timezone-info">
                        {country.timezones[0] || "No timezone info"}
                      </p> */}
                    </div>
                  </div>
                ))}
              </div>
              {filteredCountries.length > 20 && (
                <p className="info-text">
                  Showing 20 of {filteredCountries.length} countries. Use search
                  to find more.
                </p>
              )}
            </>
          )}
        </section>

        {/* Section 2: Add Country Form */}
        <section className="section">
          <h2>Add Country</h2>
          <form onSubmit={handleAddCountry} className="add-form">
            <div className="form-group">
              <label htmlFor="countryName">Country Name *</label>
              <input
                type="text"
                id="countryName"
                name="countryName"
                value={formData.countryName}
                onChange={handleInputChange}
                placeholder="Enter country name (e.g., United States)"
                className={errors.countryName ? "error" : ""}
              />
              {errors.countryName && (
                <span className="error-text">{errors.countryName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="timeZone">Timezone *</label>
              <input
                type="text"
                id="timeZone"
                name="timeZone"
                value={formData.timeZone}
                onChange={handleInputChange}
                placeholder="Enter timezone (e.g., UTC+5:30)"
                className={errors.timeZone ? "error" : ""}
              />
              {errors.timeZone && (
                <span className="error-text">{errors.timeZone}</span>
              )}
              <small>Format: UTC±HH:MM (e.g., UTC-5, UTC+5:30)</small>
            </div>

            <button type="submit" className="btn btn-primary">
              Add Country
            </button>
          </form>
        </section>

        {/* Section 3: Added Countries List */}
        {addedCountries.length > 0 && (
          <section className="section">
            <h2>Your Added Countries ({addedCountries.length})</h2>
            <div className="added-countries">
              {addedCountries.map((country) => (
                <div key={country.id} className="added-country-card">
                  <img
                    src={country.flag}
                    alt={`${country.name} flag`}
                    className="country-flag"
                  />
                  <div className="country-details">
                    <h4>{country.name}</h4>
                    <p className="timezone-display">
                      ⏰ {country.addedTimeZone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Time Calculator */}
        {addedCountries.length > 0 && (
          <section className="section">
            <h2>Calculate Time for Countries</h2>
            <div className="time-calculator">
              <div className="calculator-controls">
                <div className="form-group">
                  <label htmlFor="selectCountry">Select Base Country *</label>
                  <select
                    id="selectCountry"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="country-select"
                  >
                    <option value="">Choose a country</option>
                    {addedCountries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name} ({country.addedTimeZone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="currentTime">
                    Current Time in Selected Country *
                  </label>
                  <input
                    type="time"
                    id="currentTime"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="time-input"
                  />
                </div>

                {errors.calculation && (
                  <div className="error-message">{errors.calculation}</div>
                )}

                <button
                  onClick={calculateTimes}
                  className="btn btn-calculate"
                  disabled={!selectedCountry || !selectedTime}
                >
                  Calculate Times
                </button>
              </div>

              {/* Results */}
              {calculatedTimes.length > 0 && (
                <div className="results-section">
                  <h3>Calculated Times</h3>
                  <div className="results-grid">
                    {calculatedTimes.map((result, index) => (
                      <div key={index} className="result-card">
                        <img
                          src={result.flag}
                          alt={`${result.country} flag`}
                          className="result-flag"
                        />
                        <div className="result-details">
                          <h4>{result.country}</h4>
                          <p className="result-time">🕒 {result.time}</p>
                          <p className="result-timezone">{result.timeZone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <footer className="footer">
        <p>World Time Calculator • All timezone calculations are estimates</p>
      </footer>
    </div>
  );
}

export default App;
