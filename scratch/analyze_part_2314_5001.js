const { getPoolD4 } = require('../backend/db');

async function analyzePartOrders() {
  try {
    const pool = await getPoolD4();
    const result = await pool.request().query(`
      SELECT 
        p.ID as StepId,
        bk.BK_BKBE_NUMMER as ContractNumber,
        b.BP_POSITION_NUMMER as OrderPos,
        CAST(b.BP_ARTIKEL_BEZEICHNUNG AS VARCHAR(500)) as ArticleDesc,
        p.PSP_POSITION_NUMMER as StepPos,
        CAST(p.PSP_BEZEICHNUNG AS VARCHAR(500)) as StepDesc,
        p.PSP_ZEIT_TAGE_DURCHLAUFZEIT as BaseThroughputDays,
        p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupSollMin,
        p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdSollMin,
        (
          SELECT COUNT(DISTINCT CAST(PSPP_DATUM_START AS DATE))
          FROM [D4].[dbo].[tPPS_SKKALP_PLAN] planT
          WHERE planT.PSPP_IDPSKP = p.ID AND planT.PSPP_STATUS_PLANUNG <> 1
        ) as PlannedDays,
        (
          SELECT MIN(zbw.ZBUBW_DATUM_ZEIT_START)
          FROM [D4].[dbo].[tZE_BUCH] zb
          JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
          WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START > '1900-01-01'
        ) as FirstBookDate,
        (
          SELECT MAX(ISNULL(zbw.ZBUBW_DATUM_ZEIT_STOP, zbw.ZBUBW_DATUM_ZEIT_START))
          FROM [D4].[dbo].[tZE_BUCH] zb
          JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
          WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START > '1900-01-01'
        ) as LastBookDate,
        (
          SELECT COUNT(DISTINCT CAST(zbw.ZBUBW_DATUM_ZEIT_START AS DATE))
          FROM [D4].[dbo].[tZE_BUCH] zb
          JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
          WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START > '1900-01-01'
        ) as UsedCalendarDays,
        (
          SELECT ISNULL(SUM(
            CASE 
              WHEN zbw.ZBUBW_DATUM_ZEIT_STOP IS NOT NULL AND zbw.ZBUBW_DATUM_ZEIT_STOP > '1900-01-01' THEN
                DATEDIFF(minute, zbw.ZBUBW_DATUM_ZEIT_START, zbw.ZBUBW_DATUM_ZEIT_STOP)
              ELSE 0
            END
          ), 0)
          FROM [D4].[dbo].[tZE_BUCH] zb
          JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
          WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START > '1900-01-01'
        ) as TotalBookedMinutes
      FROM [D4].[dbo].[tPPS_SKKALP] p
      JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
      JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
      WHERE (b.BP_ARTIKEL_BEZEICHNUNG LIKE '%2314-5001%' OR b.BP_ARTIKEL_BEZEICHNUNG LIKE '%10285042%')
        AND (p.PSP_POSITION_NUMMER = '060' OR p.PSP_POSITION_NUMMER = '60')
        AND EXISTS (
          SELECT 1 FROM [D4].[dbo].[tZE_BUCH] zb
          JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
          WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START > '1900-01-01'
        )
      ORDER BY bk.BK_BKBE_NUMMER DESC, b.BP_POSITION_NUMMER ASC
    `);

    console.log(JSON.stringify(result.recordset, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

analyzePartOrders();
