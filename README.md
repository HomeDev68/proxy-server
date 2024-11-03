To run the JavaScript implementation of the HTTP proxy, use the following command:

```bash
node source-code/proxy.js
```

To use the JavaScript implementation of the HTTP proxy, follow these steps:

1. Start the proxy server by running the command above.
2. Configure your web browser or application to use the proxy server. Set the proxy server address to `localhost` and the port to `6969`.
3. Access websites through the proxy server. The proxy server will handle HTTP and HTTPS requests, cache responses, and block access to specified sites.
4. To manage the proxy server, use the following commands in the terminal where the proxy server is running:
   - `blocked`: List currently blocked sites.
   - `cached`: List currently cached sites.
   - `close`: Close the proxy server.
   - `<site_url>`: Block the specified site URL.
