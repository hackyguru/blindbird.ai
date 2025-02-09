// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AIInferenceMarketplace {
    // Custom error messages
    error NotAuthorized();
    error InvalidAmount();
    error InsufficientBalance();
    error OperatorNotRegistered();
    error AlreadyRegistered();
    error PaymentFailed();
    error WithdrawalFailed();
    error InvalidAddress();
    error InvalidState();

    // Structs
    struct Operator {
        bool isRegistered;
        uint256 totalEarnings;
        uint256 availableBalance;
        uint256 completedTasks;
        uint256 minimumPayment;
        uint256 costPerToken;
        string modelDetails;
        bool isActive;
    }

    struct InferenceRequest {
        address user;
        uint256 tokenCount;
        uint256 payment;
        uint256 timestamp;
        bool completed;
    }

    struct UserStats {
        uint256 totalSpent;
        uint256 totalRequests;
        uint256 lastInteraction;
    }

    // State variables
    address public owner;
    uint256 public platformFee; // in basis points (1/100 of 1%)
    uint256 public totalTransactions;
    uint256 public totalVolume;
    
    // Mappings
    mapping(address => Operator) public operators;
    mapping(address => UserStats) public users;
    mapping(address => mapping(uint256 => InferenceRequest)) public requests;
    mapping(address => uint256) public requestCounts;
    mapping(address => uint256) public platformFeeBalance;

    // Events
    event OperatorRegistered(address indexed operator, string modelDetails);
    event OperatorUpdated(address indexed operator, string modelDetails);
    event InferenceRequested(
        address indexed user,
        address indexed operator,
        uint256 requestId,
        uint256 payment
    );
    event InferenceCompleted(
        address indexed operator,
        uint256 requestId,
        uint256 payment
    );
    event FundsWithdrawn(address indexed account, uint256 amount);
    event PlatformFeeUpdated(uint256 newFee);

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyRegisteredOperator() {
        if (!operators[msg.sender].isRegistered) revert OperatorNotRegistered();
        _;
    }

    modifier validAddress(address _address) {
        if (_address == address(0)) revert InvalidAddress();
        _;
    }

    constructor(uint256 _platformFee) {
        if (_platformFee > 1000) revert InvalidAmount(); // Max 10%
        owner = msg.sender;
        platformFee = _platformFee;
    }

    // Main functions
    function registerOperator(
        uint256 _minimumPayment,
        uint256 _costPerToken,
        string calldata _modelDetails
    ) external {
        if (operators[msg.sender].isRegistered) revert AlreadyRegistered();
        if (_minimumPayment == 0 || _costPerToken == 0) revert InvalidAmount();

        operators[msg.sender] = Operator({
            isRegistered: true,
            totalEarnings: 0,
            availableBalance: 0,
            completedTasks: 0,
            minimumPayment: _minimumPayment,
            costPerToken: _costPerToken,
            modelDetails: _modelDetails,
            isActive: true
        });

        emit OperatorRegistered(msg.sender, _modelDetails);
    }

    function updateOperator(
        uint256 _minimumPayment,
        uint256 _costPerToken,
        string calldata _modelDetails,
        bool _isActive
    ) external onlyRegisteredOperator {
        if (_minimumPayment == 0 || _costPerToken == 0) revert InvalidAmount();

        Operator storage operator = operators[msg.sender];
        operator.minimumPayment = _minimumPayment;
        operator.costPerToken = _costPerToken;
        operator.modelDetails = _modelDetails;
        operator.isActive = _isActive;

        emit OperatorUpdated(msg.sender, _modelDetails);
    }

    function requestInference(
        address _operator,
        uint256 _tokenCount
    ) external payable validAddress(_operator) {
        Operator storage operator = operators[_operator];
        if (!operator.isRegistered || !operator.isActive) revert OperatorNotRegistered();

        uint256 payment = calculatePayment(_operator, _tokenCount);
        if (msg.value < payment) revert InsufficientBalance();

        uint256 requestId = requestCounts[_operator]++;
        uint256 platformFeeAmount = (payment * platformFee) / 10000;
        uint256 operatorPayment = payment - platformFeeAmount;

        // Update operator balance
        operator.availableBalance += operatorPayment;
        operator.totalEarnings += operatorPayment;
        platformFeeBalance[owner] += platformFeeAmount;

        // Create request
        requests[_operator][requestId] = InferenceRequest({
            user: msg.sender,
            tokenCount: _tokenCount,
            payment: operatorPayment,
            timestamp: block.timestamp,
            completed: false
        });

        // Update user stats
        UserStats storage userStats = users[msg.sender];
        userStats.totalSpent += payment;
        userStats.totalRequests += 1;
        userStats.lastInteraction = block.timestamp;

        // Update global stats
        totalTransactions += 1;
        totalVolume += payment;

        emit InferenceRequested(msg.sender, _operator, requestId, payment);
    }

    function completeInference(
        uint256 _requestId
    ) external onlyRegisteredOperator {
        InferenceRequest storage request = requests[msg.sender][_requestId];
        if (request.completed) revert InvalidState();
        
        request.completed = true;
        operators[msg.sender].completedTasks += 1;

        emit InferenceCompleted(msg.sender, _requestId, request.payment);
    }

    function withdrawFunds() external {
        uint256 amount;
        if (msg.sender == owner) {
            amount = platformFeeBalance[owner];
            platformFeeBalance[owner] = 0;
        } else {
            Operator storage operator = operators[msg.sender];
            if (!operator.isRegistered) revert OperatorNotRegistered();
            amount = operator.availableBalance;
            operator.availableBalance = 0;
        }

        if (amount == 0) revert InsufficientBalance();

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert WithdrawalFailed();

        emit FundsWithdrawn(msg.sender, amount);
    }

    // View functions
    function calculatePayment(
        address _operator,
        uint256 _tokenCount
    ) public view returns (uint256) {
        Operator storage operator = operators[_operator];
        uint256 basePayment = _tokenCount * operator.costPerToken;
        return basePayment < operator.minimumPayment ? operator.minimumPayment : basePayment;
    }

    function getOperatorDetails(
        address _operator
    ) external view returns (
        bool isRegistered,
        uint256 totalEarnings,
        uint256 availableBalance,
        uint256 completedTasks,
        uint256 minimumPayment,
        uint256 costPerToken,
        string memory modelDetails,
        bool isActive
    ) {
        Operator storage operator = operators[_operator];
        return (
            operator.isRegistered,
            operator.totalEarnings,
            operator.availableBalance,
            operator.completedTasks,
            operator.minimumPayment,
            operator.costPerToken,
            operator.modelDetails,
            operator.isActive
        );
    }

    // Admin functions
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        if (_newFee > 1000) revert InvalidAmount(); // Max 10%
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }

    // Fallback and receive functions
    receive() external payable {}
    fallback() external payable {}
}