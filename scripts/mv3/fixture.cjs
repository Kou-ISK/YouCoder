// Entirely generated test media: 120 seconds of silent PCM, no downloaded video.
const A = "YC_TEST_A01",
  B = "YC_TEST_B02"
const fixture = {
  teams: ["Alpha", "Beta"],
  buttonSets: [
    {
      setName: "QA",
      buttons: [
        {
          action: "Pass",
          labels: { Result: ["成功", "失敗"], Note: ['日本語,"引用"\n二行目'] }
        },
        { action: "Shot", labels: { Result: ["Goal"] } }
      ]
    }
  ],
  selectedButtonSet: "QA",
  showExtension: true
}
function fixtureHtml() {
  const wav = Buffer.alloc(44 + 8000 * 120)
  wav.write("RIFF")
  wav.writeUInt32LE(wav.length - 8, 4)
  wav.write("WAVEfmt ", 8)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(1, 22)
  wav.writeUInt32LE(8000, 24)
  wav.writeUInt32LE(8000, 28)
  wav.writeUInt16LE(1, 32)
  wav.writeUInt16LE(8, 34)
  wav.write("data", 36)
  wav.writeUInt32LE(wav.length - 44, 40)
  wav.fill(128, 44)
  return `<!doctype html><meta charset="utf-8"><title>YouCoder synthetic fixture</title>
<style>body{font:16px sans-serif;background:#eef2f6;margin:24px}ytd-watch-flexy{display:block}#player{width:min(832px,100%);height:520px}video{width:100%;height:100%;background:#122030}#below{width:100%;min-width:0}</style>
<h1>YouCoder synthetic page</h1><p>Generated fixture / no account / no YouTube media</p>
<ytd-watch-flexy><div id="player"><video controls preload="auto" muted src="data:audio/wav;base64,${wav.toString("base64")}"></video></div><div id="below"></div></ytd-watch-flexy>`
}
module.exports = { A, B, fixture, fixtureHtml }
