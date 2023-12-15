::connects to igor via ssh, in order to forward the virtual server ssh port to localhost port 9999 
::need to connect to igor to bypass college firewalls
ssh -L 9999:myserver:2559 cgard008@doc.gold.ac.uk