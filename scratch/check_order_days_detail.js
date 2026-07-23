const { getPoolD4 } = require('../backend/db');

async function checkOrderDetails() {
  try {
    const pool = await getPoolD4();
    
    // 1. Fetch step details for order P202584655 / Pos 10 / AS 040
    const stepRes = await pool.request().query(`
      SELECT 
        p.ID as StepId,
        b.BP_IDAR as ArticleId,
        bk.BK_BKBE_NUMMER as ContractNumber,
        b.BP_POSITION_NUMMER as OrderPos,
        CAST(b.BP_ARTIKEL_BEZEICHNUNG AS VARCHAR(500)) as ArticleDesc,
        p.PSP_POSITION_NUMMER as StepPos,
        CAST(p.PSP_BEZEICHNUNG AS VARCHAR(500)) as StepDesc,
        p.PSP_ZEIT_TAGE_DURCHLAUFZEIT as BaseThroughputDays,
        p.PSP_ZEIT_MINUTEN_RUESTUNG_GESAMT_SOLL as SetupSollMin,
        p.PSP_ZEIT_MINUTEN_PRODUKTION_GESAMT_SOLL as ProdSollMin,
        m.MS_BEZEICHNUNG as MachineName
      FROM [D4].[dbo].[tPPS_SKKALP] p
      JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
      JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m ON p.PSP_IDMS = m.ID
      WHERE bk.BK_BKBE_NUMMER LIKE '%202584655%'
        AND (b.BP_POSITION_NUMMER = '10' OR b.BP_POSITION_NUMMER = 10)
        AND (p.PSP_POSITION_NUMMER = '040' OR p.PSP_POSITION_NUMMER = '40')
    `);

    console.log('=== TARGET ORDER STEP INFO ===');
    console.log(JSON.stringify(stepRes.recordset, null, 2));

    if (stepRes.recordset.length > 0) {
      const stepRow = stepRes.recordset[0];
      const stepId = stepRow.StepId;
      const articleId = stepRow.ArticleId;
      const stepPos = stepRow.StepPos;

      // 2. Geplante Tage im konkreten Auftragsarbeitsplan (tPPS_SKKALP_PLAN)
      const planRes = await pool.request().query(`
        SELECT 
          PSPP_DATUM_START as PlannedDate,
          PSPP_ZEIT as PlannedMinutes
        FROM [D4].[dbo].[tPPS_SKKALP_PLAN]
        WHERE PSPP_IDPSKP = ${stepId} AND PSPP_STATUS_PLANUNG <> 1
        ORDER BY PSPP_DATUM_START ASC
      `);

      const distinctPlanDays = new Set(planRes.recordset.map(r => r.PlannedDate ? r.PlannedDate.toISOString().substring(0, 10) : ''));
      console.log('\n=== GEPLANTE TAGE IM KONKRETEN AUFTRAG (tPPS_SKKALP_PLAN) ===');
      console.log(`Anzahl geplante Durchlauftage (Plantabelle): ${distinctPlanDays.size}`);
      console.log(JSON.stringify(planRes.recordset, null, 2));

      // 3. Gebrauchte Tage bisher (tZE_BUCH & tZE_BUCH_BEWE)
      const bookRes = await pool.request().query(`
        SELECT 
          zb.ID as BuchungId,
          zbw.ZBUBW_DATUM_ZEIT_START as StartTime,
          zbw.ZBUBW_DATUM_ZEIT_STOP as StopTime,
          zbw.ZBUBW_TYP_ZEIT as TypZeit
        FROM [D4].[dbo].[tZE_BUCH] zb
        LEFT JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
        WHERE zb.ZBU_IDPSKP = ${stepId}
        ORDER BY zbw.ZBUBW_DATUM_ZEIT_START ASC
      `);

      const distinctBookDays = new Set(
        bookRes.recordset
          .filter(r => r.StartTime && r.StartTime > '1900-01-01')
          .map(r => new Date(r.StartTime).toISOString().substring(0, 10))
      );

      console.log('\n=== ZEITERFASSUNG / GEBRAUCHTE TAGE (tZE_BUCH_BEWE) ===');
      console.log(`Gebrauchte Tage bisher: ${distinctBookDays.size}`);
      console.log(`Tage-Liste:`, Array.from(distinctBookDays));
      console.log(JSON.stringify(bookRes.recordset, null, 2));

      // 4. Historischer Durchschnitt für diesen Artikel & Arbeitsschritt 040
      const histRes = await pool.request().query(`
        SELECT 
          p.ID as HistoricalStepId,
          bk.BK_BKBE_NUMMER as ContractNumber,
          b.BP_POSITION_NUMMER as OrderPos,
          (
            SELECT COUNT(DISTINCT CAST(zbw.ZBUBW_DATUM_ZEIT_START AS DATE))
            FROM [D4].[dbo].[tZE_BUCH] zb
            JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
            WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START > '1900-01-01'
          ) as UsedCalendarDays
        FROM [D4].[dbo].[tPPS_SKKALP] p
        JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
        JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
        JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
        WHERE b.BP_IDAR = ${articleId}
          AND (p.PSP_POSITION_NUMMER = '${stepPos}' OR p.PSP_POSITION_NUMMER = '${parseInt(stepPos, 10)}')
          AND EXISTS (
            SELECT 1 FROM [D4].[dbo].[tZE_BUCH] zb
            JOIN [D4].[dbo].[tZE_BUCH_BEWE] zbw ON zbw.ZBUBW_IDZBU = zb.ID
            WHERE zb.ZBU_IDPSKP = p.ID AND zbw.ZBUBW_DATUM_ZEIT_START > '1900-01-01'
          )
      `);

      console.log('\n=== HISTORISCHE AUFTRÄGE DIESES ARTIKELS (AS 040) ===');
      console.log(JSON.stringify(histRes.recordset, null, 2));

      if (histRes.recordset.length > 0) {
        const totalHistDays = histRes.recordset.reduce((sum, r) => sum + r.UsedCalendarDays, 0);
        const avgHistDays = totalHistDays / histRes.recordset.length;
        console.log(`\nHistorischer Durchschnitt über ${histRes.recordset.length} fertige Aufträge: ${avgHistDays.toFixed(2)} Tage (gerundet: ${Math.round(avgHistDays)} Tage)`);
      } else {
        console.log('\nKeine vergangenen Buchungen für diesen Artikel in AS 040 gefunden.');
      }
    } else {
      console.log('Kein passender Fertigungsauftrag gefunden. Suche nach allen Aufträgen mit 202584655...');
      const fallbackRes = await pool.request().query(`
        SELECT 
          bk.BK_BKBE_NUMMER, b.BP_POSITION_NUMMER, p.PSP_POSITION_NUMMER, CAST(p.PSP_BEZEICHNUNG AS VARCHAR(200)) as StepDesc
        FROM [D4].[dbo].[tPPS_SKKALP] p
        JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
        JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
        JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
        WHERE bk.BK_BKBE_NUMMER LIKE '%202584655%'
      `);
      console.log(JSON.stringify(fallbackRes.recordset, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkOrderDetails();
