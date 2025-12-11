import axios from "axios";

export async function lookupPostcode(postcode) {
  if (!postcode) return null;

  try {
    const response = await axios.get(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);

    if (response.data.status !== 200) return null;

    const r = response.data.result;

    return {
      postcode: r.postcode,
      town: r.post_town,
      county: r.admin_county || r.admin_district || "",
      country: r.country,
      lat: r.latitude,
      lng: r.longitude,
    };

  } catch (err) {
    return null;
  }
}
