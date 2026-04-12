param(
  [string]$InputHtml = "public/index.html",
  [string]$OutputXlsx = "public/assets/Rekap_Koordinat_Perjurusan_Perfakultas.xlsx"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function ConvertTo-ExcelColumn {
  param([int]$Index)

  if ($Index -lt 1) {
    throw "Index kolom harus >= 1."
  }

  $name = ""
  $n = $Index
  while ($n -gt 0) {
    $rem = ($n - 1) % 26
    $name = [char](65 + $rem) + $name
    $n = [int](($n - 1) / 26)
  }
  return $name
}

function Escape-XmlText {
  param([string]$Value)

  if ($null -eq $Value) {
    return ""
  }

  $singleLine = $Value.Replace("`r", " ").Replace("`n", " ")
  $escaped = [System.Security.SecurityElement]::Escape($singleLine)
  if ($null -eq $escaped) {
    return ""
  }
  return $escaped
}

function New-RowXml {
  param(
    [int]$RowNumber,
    [object[]]$Values,
    [int[]]$NumericColumns
  )

  $culture = [System.Globalization.CultureInfo]::InvariantCulture
  $numStyle = [System.Globalization.NumberStyles]::Float
  $sb = New-Object System.Text.StringBuilder

  for ($i = 0; $i -lt $Values.Count; $i++) {
    $col = $i + 1
    $cellRef = "{0}{1}" -f (ConvertTo-ExcelColumn -Index $col), $RowNumber
    $rawValue = $Values[$i]
    $textValue = if ($null -eq $rawValue) { "" } else { [string]$rawValue }

    if ($NumericColumns -contains $col) {
      $parsed = 0.0
      if ([double]::TryParse($textValue, $numStyle, $culture, [ref]$parsed)) {
        $num = $parsed.ToString($culture)
        [void]$sb.Append("<c r=`"$cellRef`"><v>$num</v></c>")
        continue
      }
    }

    $esc = Escape-XmlText -Value $textValue
    [void]$sb.Append("<c r=`"$cellRef`" t=`"inlineStr`"><is><t>$esc</t></is></c>")
  }

  return "<row r=`"$RowNumber`">$($sb.ToString())</row>"
}

function New-SheetXml {
  param(
    [string[]]$Headers,
    [object[]]$Rows,
    [int[]]$NumericColumns
  )

  $sheetRows = New-Object System.Collections.Generic.List[string]
  $sheetRows.Add((New-RowXml -RowNumber 1 -Values $Headers -NumericColumns @()))

  $rowNumber = 2
  foreach ($row in $Rows) {
    $sheetRows.Add((New-RowXml -RowNumber $rowNumber -Values $row -NumericColumns $NumericColumns))
    $rowNumber++
  }

  $lastCol = ConvertTo-ExcelColumn -Index $Headers.Count
  $lastRow = [Math]::Max(1, $rowNumber - 1)
  $dimension = "A1:{0}{1}" -f $lastCol, $lastRow

  return @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="$dimension"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <sheetData>$($sheetRows -join "")</sheetData>
</worksheet>
"@
}

function Write-Utf8NoBom {
  param(
    [string]$LiteralPath,
    [string]$Content
  )

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($LiteralPath, $Content, $utf8NoBom)
}

$rootPath = (Get-Location).Path
$inputPath = if ([System.IO.Path]::IsPathRooted($InputHtml)) { $InputHtml } else { Join-Path $rootPath $InputHtml }
$outputPath = if ([System.IO.Path]::IsPathRooted($OutputXlsx)) { $OutputXlsx } else { Join-Path $rootPath $OutputXlsx }

if (-not (Test-Path -LiteralPath $inputPath)) {
  throw "File input tidak ditemukan: $inputPath"
}

$outputDir = Split-Path -Path $outputPath -Parent
if (-not (Test-Path -LiteralPath $outputDir)) {
  New-Item -Path $outputDir -ItemType Directory -Force | Out-Null
}

$html = Get-Content -LiteralPath $inputPath -Raw -Encoding UTF8
$regexOpt = [System.Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [System.Text.RegularExpressions.RegexOptions]::Singleline

$selectMatch = [regex]::Match($html, '<select\b[^>]*\bid="lokasiInsiden"[^>]*>([\s\S]*?)</select>', $regexOpt)
if (-not $selectMatch.Success) {
  throw "Blok select dengan id='lokasiInsiden' tidak ditemukan."
}

$selectInner = $selectMatch.Groups[1].Value
$groupMatches = [regex]::Matches($selectInner, '<optgroup\b[^>]*\blabel="([^"]+)"[^>]*>([\s\S]*?)</optgroup>', $regexOpt)
if ($groupMatches.Count -eq 0) {
  throw "Tidak ada optgroup fakultas yang ditemukan."
}

$detailRows = New-Object "System.Collections.Generic.List[object]"
$facultyOrder = New-Object "System.Collections.Generic.List[string]"

foreach ($group in $groupMatches) {
  $faculty = [System.Net.WebUtility]::HtmlDecode($group.Groups[1].Value).Trim()
  if ([string]::IsNullOrWhiteSpace($faculty)) {
    continue
  }
  if (-not $facultyOrder.Contains($faculty)) {
    $facultyOrder.Add($faculty)
  }

  $groupInner = $group.Groups[2].Value
  $optionMatches = [regex]::Matches($groupInner, '<option\b([^>]*)>([\s\S]*?)</option>', $regexOpt)

  foreach ($option in $optionMatches) {
    $attrText = $option.Groups[1].Value
    $latMatch = [regex]::Match($attrText, '\bdata-lat="([^"]+)"', $regexOpt)
    $lngMatch = [regex]::Match($attrText, '\bdata-lng="([^"]+)"', $regexOpt)
    if (-not $latMatch.Success -or -not $lngMatch.Success) {
      continue
    }

    $jurusanRaw = $option.Groups[2].Value
    $jurusanNoTag = [regex]::Replace($jurusanRaw, '<[^>]+>', '')
    $jurusan = [System.Net.WebUtility]::HtmlDecode($jurusanNoTag).Trim()
    if ([string]::IsNullOrWhiteSpace($jurusan)) {
      continue
    }

    $lat = $latMatch.Groups[1].Value.Trim()
    $lng = $lngMatch.Groups[1].Value.Trim()

    $detailRows.Add([pscustomobject]@{
      Fakultas  = $faculty
      Jurusan   = $jurusan
      Latitude  = $lat
      Longitude = $lng
      Koordinat = "$lat, $lng"
    })
  }
}

if ($detailRows.Count -eq 0) {
  throw "Tidak ada data jurusan berkoordinat yang ditemukan."
}

$summaryRows = New-Object "System.Collections.Generic.List[object]"
$summaryNo = 1

foreach ($faculty in $facultyOrder) {
  $items = @($detailRows | Where-Object { $_.Fakultas -eq $faculty })
  if ($items.Count -eq 0) {
    continue
  }

  $uniqueCoords = @(
    $items |
      ForEach-Object { "{0}, {1}" -f $_.Latitude, $_.Longitude } |
      Sort-Object -Unique
  )

  $summaryRows.Add([pscustomobject]@{
    No                  = $summaryNo
    Fakultas            = $faculty
    JumlahJurusan       = $items.Count
    JumlahKoordinat     = $items.Count
    JumlahKoordinatUnik = $uniqueCoords.Count
  })

  $summaryNo++
}

$sheet1Data = @()
$no = 1
foreach ($item in $detailRows) {
  $sheet1Data += ,@(
    $no,
    $item.Fakultas,
    $item.Jurusan,
    $item.Latitude,
    $item.Longitude,
    $item.Koordinat
  )
  $no++
}

$sheet2Data = @()
foreach ($item in $summaryRows) {
  $sheet2Data += ,@(
    $item.No,
    $item.Fakultas,
    $item.JumlahJurusan,
    $item.JumlahKoordinat,
    $item.JumlahKoordinatUnik
  )
}

$sheet1Xml = New-SheetXml `
  -Headers @("No", "Fakultas", "Jurusan", "Latitude", "Longitude", "Koordinat") `
  -Rows $sheet1Data `
  -NumericColumns @(1, 4, 5)

$sheet2Xml = New-SheetXml `
  -Headers @("No", "Fakultas", "Jumlah Jurusan", "Jumlah Koordinat", "Jumlah Koordinat Unik") `
  -Rows $sheet2Data `
  -NumericColumns @(1, 3, 4, 5)

$contentTypesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>
"@

$relsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"@

$workbookXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Rincian Jurusan" sheetId="1" r:id="rId1"/>
    <sheet name="Rekap Fakultas" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>
"@

$workbookRelsXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"@

$stylesXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1">
    <font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
</styleSheet>
"@

$createdUtc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$coreXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:creator>ITSafe Team</dc:creator>
  <cp:lastModifiedBy>ITSafe Team</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">$createdUtc</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">$createdUtc</dcterms:modified>
  <dc:title>Rekap Koordinat Jurusan per Fakultas</dc:title>
</cp:coreProperties>
"@

$appXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Microsoft Excel</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>2</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="2" baseType="lpstr">
      <vt:lpstr>Rincian Jurusan</vt:lpstr>
      <vt:lpstr>Rekap Fakultas</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0300</AppVersion>
</Properties>
"@

$tempRoot = Join-Path $rootPath (".tmp_xlsx_" + [Guid]::NewGuid().ToString("N"))

try {
  New-Item -Path $tempRoot -ItemType Directory -Force | Out-Null
  New-Item -Path (Join-Path $tempRoot "_rels") -ItemType Directory -Force | Out-Null
  New-Item -Path (Join-Path $tempRoot "docProps") -ItemType Directory -Force | Out-Null
  New-Item -Path (Join-Path $tempRoot "xl") -ItemType Directory -Force | Out-Null
  New-Item -Path (Join-Path $tempRoot "xl\_rels") -ItemType Directory -Force | Out-Null
  New-Item -Path (Join-Path $tempRoot "xl\worksheets") -ItemType Directory -Force | Out-Null

  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "[Content_Types].xml") -Content $contentTypesXml
  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "_rels\.rels") -Content $relsXml
  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "docProps\core.xml") -Content $coreXml
  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "docProps\app.xml") -Content $appXml
  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "xl\workbook.xml") -Content $workbookXml
  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "xl\styles.xml") -Content $stylesXml
  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "xl\_rels\workbook.xml.rels") -Content $workbookRelsXml
  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "xl\worksheets\sheet1.xml") -Content $sheet1Xml
  Write-Utf8NoBom -LiteralPath (Join-Path $tempRoot "xl\worksheets\sheet2.xml") -Content $sheet2Xml

  $zipPath = [System.IO.Path]::ChangeExtension($outputPath, ".zip")

  if (Test-Path -LiteralPath $outputPath) {
    Remove-Item -LiteralPath $outputPath -Force
  }
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }

  Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal
  Move-Item -LiteralPath $zipPath -Destination $outputPath -Force
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}

Write-Host "Berhasil membuat file:"
Write-Host $outputPath
Write-Host ("Jumlah jurusan: {0}" -f $detailRows.Count)
Write-Host ("Jumlah fakultas: {0}" -f $summaryRows.Count)
