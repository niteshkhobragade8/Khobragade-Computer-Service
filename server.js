const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors({ origin: ['https://9637832490.online', 'https://www.9637832490.online'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;
const PAYU_MODE = (process.env.PAYU_MODE || 'production').toLowerCase();
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://9637832490.online';
const BACKEND_URL = process.env.BACKEND_URL || '';

function sha512(s) {
  return crypto.createHash('sha512').update(String(s)).digest('hex');
}

function initFirebase() {
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.firestore();
}

function payuEndpoints() {
  return PAYU_MODE === 'production'
    ? {
        payment: 'https://secure.payu.in/_payment',
        verify: 'https://info.payu.in/merchant/postservice.php?form=2'
      }
    : {
        payment: 'https://test.payu.in/_payment',
        verify: 'https://test.payu.in/merchant/postservice.php?form=2'
      };
}

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'KCSC PayU Backend', version: '2.0.0' });
});

app.post('/create-payment', async (req, res) => {
  try {
    if (!PAYU_KEY || !PAYU_SALT || !BACKEND_URL) {
      return res.status(500).json({ error: 'PayU backend environment not configured' });
    }

    const { applicationDocId, applicationId, amount, firstname, email, phone, productinfo } = req.body || {};
    if (!applicationId || !amount || !firstname || !email || !phone) {
      return res.status(400).json({ error: 'Required payment details missing' });
    }

    const txnid = 'KCSC' + Date.now() + Math.floor(Math.random() * 1000);
    const udf1 = applicationId;
    const udf2 = applicationDocId || applicationId;
    const pinfo = productinfo || 'KCSC Service';

    const hashString = `${PAYU_KEY}|${txnid}|${amount}|${pinfo}|${firstname}|${email}|${udf1}|${udf2}|||||||||${PAYU_SALT}`;
    const hash = sha512(hashString);

    // Save pending payment before redirecting to PayU.
    try {
      const db = initFirebase();
      await db.collection('payments').doc(txnid).set({
        paymentId: txnid,
        applicationId,
        applicationDocId: udf2,
        amount: Number(amount),
        status: 'Pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await db.collection('applications').doc(udf2).set({
        paymentTransactionId: txnid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error('Firestore pending-save warning:', e.message);
    }

    return res.json({
      paymentUrl: payuEndpoints().payment,
      params: {
        key: PAYU_KEY,
        txnid,
        amount,
        productinfo: pinfo,
        firstname,
        email,
        phone,
        udf1,
        udf2,
        surl: `${BACKEND_URL}/payment-success`,
        furl: `${BACKEND_URL}/payment-failure`,
        hash
      }
    });
  } catch (error) {
    console.error('create-payment error:', error);
    return res.status(500).json({ error: 'Unable to create payment' });
  }
});

function verifyResponseHash(data) {
  if (!data || !data.hash || !PAYU_SALT) return false;
  const additionalCharges = data.additionalCharges || data.additional_charges;
  const reverse = `${PAYU_SALT}|${data.status || ''}|||||||||${data.udf2 || ''}|${data.udf1 || ''}|${data.email || ''}|${data.firstname || ''}|${data.productinfo || ''}|${data.amount || ''}|${data.txnid || ''}|${data.key || ''}`;
  const str = additionalCharges ? `${additionalCharges}|${reverse}` : reverse;
  return sha512(str).toLowerCase() === String(data.hash).toLowerCase();
}

async function verifyWithPayU(txnid) {
  const command = 'verify_payment';
  const hash = sha512(`${PAYU_KEY}|${command}|${txnid}|${PAYU_SALT}`);
  const body = new URLSearchParams({ key: PAYU_KEY, command, var1: txnid, hash });
  const r = await fetch(payuEndpoints().verify, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const text = await r.text();
  let json = {};
  try { json = JSON.parse(text); } catch (_) {}
  if (!r.ok) throw new Error(`PayU verify HTTP ${r.status}`);
  const detail = json.transaction_details?.[txnid] || json.result?.[txnid] || null;
  return { raw: json, detail };
}

async function updatePaymentState(data, fallbackStatus) {
  const db = initFirebase();
  const txnid = String(data.txnid || '');
  const applicationId = String(data.udf1 || '');
  const applicationDocId = String(data.udf2 || applicationId);

  let verifiedStatus = fallbackStatus;
  let mihpayid = data.mihpayid || '';
  let amountOk = true;

  if (txnid) {
    try {
      const verified = await verifyWithPayU(txnid);
      const d = verified.detail || {};
      verifiedStatus = String(d.status || d.unmappedstatus || data.status || fallbackStatus || '').toLowerCase();
      mihpayid = d.mihpayid || mihpayid;
      if (d.amt != null || d.amount != null) {
        amountOk = Math.abs(Number(d.amt ?? d.amount) - Number(data.amount || 0)) < 0.01;
      }
    } catch (e) {
      console.error('PayU verify warning:', e.message);
    }
  }

  const paid = ['success', 'captured'].includes(String(verifiedStatus).toLowerCase()) && amountOk;
  const paymentStatus = paid ? 'Paid' : (String(verifiedStatus).toLowerCase() === 'failure' ? 'Failed' : 'Pending');
  const appStatus = paid ? 'Pending' : (paymentStatus === 'Failed' ? 'Payment Failed' : 'Pending Payment');

  if (applicationDocId) {
    await db.collection('applications').doc(applicationDocId).set({
      paymentStatus,
      status: appStatus,
      paymentTransactionId: txnid,
      transactionReference: txnid,
      mihpayid,
      paidAt: paid ? admin.firestore.FieldValue.serverTimestamp() : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const appSnap = await db.collection('applications').doc(applicationDocId).get();
    const ad = appSnap.exists ? appSnap.data() : {};
    if (applicationId) {
      await db.collection('publicApplicationStatus').doc(applicationId).set({
        applicationId,
        mobileLast4: String(ad.mobile || '').slice(-4),
        serviceName: ad.serviceName || '',
        actionName: ad.actionName || '',
        paymentStatus,
        status: appStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }

  if (txnid) {
    await db.collection('payments').doc(txnid).set({
      paymentId: txnid,
      applicationId,
      applicationDocId,
      amount: Number(data.amount || 0),
      status: paymentStatus,
      payuStatus: data.status || '',
      mihpayid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAt: paid ? admin.firestore.FieldValue.serverTimestamp() : null
    }, { merge: true });
  }

  return { paid, paymentStatus, appStatus, txnid, applicationId };
}

app.post('/payment-success', async (req, res) => {
  try {
    const data = req.body || {};
    if (!verifyResponseHash(data)) {
      console.error('Invalid PayU response hash for success callback');
      return res.status(400).send('Invalid PayU payment response');
    }
    const result = await updatePaymentState(data, 'success');
    const qs = new URLSearchParams({
      applicationId: result.applicationId,
      txnid: result.txnid,
      payment: result.paid ? 'success' : 'review'
    });
    return res.redirect(303, `${WEBSITE_URL}/portal/payment-success.html?${qs.toString()}`);
  } catch (e) {
    console.error('payment-success error:', e);
    return res.status(500).send('Payment received, but status update failed. Please contact support with transaction ID.');
  }
});

app.post('/payment-failure', async (req, res) => {
  try {
    const data = req.body || {};
    const hashOk = verifyResponseHash(data);
    if (!hashOk) console.error('Invalid PayU response hash for failure callback');
    let result = { applicationId: data.udf1 || '', txnid: data.txnid || '' };
    try { result = await updatePaymentState(data, 'failure'); } catch (e) { console.error('failure status update warning:', e.message); }
    const qs = new URLSearchParams({ applicationId: result.applicationId || '', txnid: result.txnid || '' });
    return res.redirect(303, `${WEBSITE_URL}/portal/payment-failure.html?${qs.toString()}`);
  } catch (e) {
    console.error('payment-failure error:', e);
    return res.redirect(303, `${WEBSITE_URL}/portal/payment-failure.html`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`KCSC PayU Backend v2 running on ${PORT}`));
