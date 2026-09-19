const url = "https://script.google.com/macros/s/AKfycbyhZkxz6mAJk2rw8UOXFMYEDP_NEt4TvlpaXY3O91phwPcS6hfE9yHLVtb7QxI5_ycf/exec";
const token = "Arnav@123";

async function test() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token, action: "test" })
    });
    const json = await res.json();
    console.log("Response:", json);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
