const { getPoolD4 } = require('../backend/db');

async function checkSpecificOrder() {
  try {
    const pool = await getPoolD4();
    
    // 1. Query step details
    const stepRes = await pool.request().query(`
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
        m.MS_BEZEICHNUNG as MachineName
      FROM [D4].[dbo].[tPPS_SKKALP] p
      JOIN [D4].[dbo].[tPPS_SKKALK] k ON p.PSP_IDPSKKK = k.ID
      JOIN [D4].[dbo].[tbe_Belp] b ON k.PSK_IDBEBP = b.ID
      JOIN [D4].[dbo].[tBE_BELK_BKBE] bk ON b.BP_IDBEBK = bk.BK_BKBE_IDBEBK
      LEFT JOIN [D4].[dbo].[tPPS_MASTA] m ON p.PSP_IDMS = m.ID
      WHERE bk.BK_BKBE_NUMMER LIKE '%202283839%'
        AND (b.BP_POSITION_NUMMER = '11' OR b.BP_POSITION_NUMMER = 11)
        AND (p.PSP_POSITION_NUMMER = '060' OR p.PSP_POSITION_NUMMER = '60')
    `);

    console.log('--- STEP INFORMATION ---');
    console.log(JSON.stringify(stepRes.recordset, null, 2));

    if (stepRes.recordset.length > 0) {
      for (const stepRow of stepRes.recordset) {
        const stepId = stepRow.StepId;
        console.log(`\n================ STEP ID: ${stepId} ================`);

        // 2. Query planned days in tPPS_SKKALP_PLAN
        const planRes = await pool.request().query(`
          SELECT 
            PSPP_DATUM_START as PlannedDate,
            PSPP_ZEIT as PlannedMinutes,
            PSPP_STATUS_PLANUNG as StatusPlanung
          FROM [D4].[dbo].[tPPS_SKKALP_PLAN]
          WHERE PSPP_IDPSKP = ${stepId}
          ORDER BY PSPP_DATUM_START ASC
        `);

        console.log('\n--- PLANNED DAYS (tPPS_SKKALP_PLAN) ---');
        console.log(JSON.stringify(planRes.recordset, null, 2));

        // 3. Query booked time entries in tZE_BUCH & tZE_BUCH_BEWE
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

        console.log('\n--- BOOKED TIME ENTRIES (tZE_BUCH_BEWE) ---');
        console.log(JSON.stringify(bookRes.recordset, null, 2));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

checkSpecificOrder();
