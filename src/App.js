import React, { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import abi from "./utils/URL_Forum.json";

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [messageValue, setMessageValue] = useState("");
  console.log("currentAccount", currentAccount);
  const contractAddress = "0x6D8470F6BA4aDe9F9d717f8ab31D42C8019E70D1";
  const contractABI = abi.abi;
  const [allPosts, setAllPosts] = useState([]);

  const getAllPosts = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const URL_ForumContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const posts = await URL_ForumContract.getAllPosts();
        const postsCleaned = posts.map((post) => {
          return {
            address: post.poster,
            timestamp: new Date(post.timestamp * 1000),
            message: post.message,
            reward: post.reward.toNumber(),
          };
        });

        setAllPosts(postsCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask");
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({
        method: "eth_accounts",
      });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authored account: ", account);
        setCurrentAccount(account);
        getAllPosts();
      } else {
        console.log("No authorized account found");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const account = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected: ", account[0]);
      setCurrentAccount(account[0]);
    } catch (err) {
      console.log(err);
    }
  };

  const post = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        console.log(await provider.getCode(contractAddress));
        const signer = provider.getSigner();
        // コントラクトインスタンスは、コントラクトに格納されている全ての関数を利用することができる
        const URL_ForumContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let contractBalance = await provider.getBalance(
          URL_ForumContract.address
        );
        console.log(
          "Contract balance:",
          ethers.utils.formatEther(contractBalance)
        );

        let contractBalance_post = await provider.getBalance(
          URL_ForumContract.address
        );
        if (contractBalance_post.lt(contractBalance)) {
          console.log("User won ETH!");
        } else {
          console.log("User didn't win ETH!");
        }
        console.log(
          "Contract balance after wave; ",
          ethers.utils.formatEther(contractBalance_post)
        );

        const postTx = await URL_ForumContract.post(messageValue, {
          gasLimit: 300000,
        });
        console.log("Mining...", postTx.hash);
        await postTx.wait();
        console.log("Mined...", postTx.hash);
      } else {
        console.log("Ethereum object doesn't exit.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewPost = (from, timestamp, message, reward) => {
      console.log("NewPost", from, timestamp, message, reward);
      setAllPosts((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
          reward: reward.toNumber(),
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      wavePortalContract.on("NewPost", onNewPost);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewPost", onNewPost);
      }
    };
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" aria-label="hand-wave">
            👋
          </span>
          WELCOME!
        </div>

        <button className="waveButton" onClick={post}>
          Post
        </button>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            ConnectWallet
          </button>
        )}

        {currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            WalletConnected
          </button>
        )}

        {currentAccount && (
          <textarea
            name="messageArea"
            placeholder="メッセージはこちら"
            type="text"
            id="message"
            value={messageValue}
            onChange={(e) => setMessageValue(e.target.value)}
          />
        )}

        {currentAccount &&
          allPosts
            .slice(0)
            .reverse()
            .map((post, index) => {
              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#F8F8FF",
                    marginTop: "16px",
                    padding: "8px",
                  }}
                >
                  <div>{post.timestamp.toString()}</div>
                  <div>Address: {post.address}</div>
                  <div>Message: {post.message}</div>
                  <div>Reward: {post.reward} Wei</div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
