::connects via ssh to igor and forwards the virtual server ssh port to localhost port 999 
::need to connect to igor to bypass college firewalls
ssh -N -L 9999:myserver:2559 cgard008@doc.gold.ac.uk