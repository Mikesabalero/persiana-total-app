const fs = require('fs');

async function deploy() {
  const workflowFile = fs.readFileSync('./chatbot_workflow.json', 'utf8');
  
  const response = await fetch('https://n8n.srv1323649.hstgr.cloud/api/v1/workflows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-N8N-API-KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZjVmMzg1NC01MDJmLTQ4MGQtODRkOS01YWQxMTNiODUzZjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiNzVmMmFjNjYtYmYzOS00ODFiLWIxNjAtNzkxYmMyZDdkYTIxIiwiaWF0IjoxNzcyNzI1MjI5fQ.arK3WxVPpeGobQmU1k8yHZZQxkPy9Vp_48CLjdI0cx4'
    },
    body: workflowFile
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

deploy().catch(console.error);
