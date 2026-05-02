// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title JudicialToken
 * @dev Smart contract for court-ordered access tokens
 * Court orders create time-limited, user-notified, revocable tokens
 * Users can veto fraudulent orders (true ownership verification)
 */
contract JudicialToken {
    struct CourtOrder {
        bytes32 orderId;
        address judgeAddress;
        string userId;
        uint256 issuedAt;
        uint256 expiresAt;
        string reason;
        bool isActive;
        bool wasAppealed;  // User vetoed
        address[] approvedBy;  // Multi-sig approvers
    }
    
    struct AccessGrant {
        address grantee;
        uint256 expiresAt;
        bool isRevoked;
        string reason;
    }
    
    // State variables
    mapping(bytes32 => CourtOrder) public courtOrders;
    mapping(string => bytes32[]) public userCourtOrders;
    mapping(address => AccessGrant) public activeGrants;
    mapping(address => bool) public authorizedJudges;
    
    // Events
    event CourtOrderIssued(
        bytes32 indexed orderId,
        string userId,
        address judge,
        uint256 expiresAt,
        string reason
    );
    
    event UserNotified(
        string indexed userId,
        bytes32 indexed orderId,
        uint256 notifiedAt
    );
    
    event CourtOrderRevoked(
        bytes32 indexed orderId,
        address revokedBy,
        string reason
    );
    
    event AccessGranted(
        address indexed grantee,
        string userId,
        uint256 expiresAt
    );
    
    event AccessRevoked(
        address indexed grantee,
        string reason
    );
    
    event MultiSigApproval(
        bytes32 indexed orderId,
        address approver
    );
    
    address public owner;
    uint256 public constant MAX_DURATION = 30 days;
    uint256 public constant MIN_APPROVALS = 3;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorizedJudge() {
        require(authorizedJudges[msg.sender], "Not authorized judge");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedJudges[msg.sender] = true;
    }
    
    /**
     * @dev Authorize a judge to issue court orders
     */
    function authorizeJudge(address judge) external onlyOwner {
        authorizedJudges[judge] = true;
    }
    
    /**
     * @dev Issue a new court order with token
     * @param userId The user ID (off-chain identifier)
     * @param durationDays Max 30 days
     * @param reason Legal reason for the order
     * @param judicialSignature Cryptographic signature (verified off-chain)
     * @return orderId The unique court order ID
     */
    function issueCourtOrder(
        string calldata userId,
        uint256 durationDays,
        string calldata reason,
        bytes calldata judicialSignature
    ) external onlyAuthorizedJudge returns (bytes32 orderId) {
        require(durationDays > 0 && durationDays <= 30, "Max 30 days");
        require(bytes(reason).length > 0, "Reason required");
        
        // Generate order ID from hash
        orderId = keccak256(
            abi.encodePacked(userId, block.timestamp, reason, msg.sender)
        );
        
        require(courtOrders[orderId].issuedAt == 0, "Order already exists");
        
        uint256 expiresAt = block.timestamp + (durationDays * 1 days);
        
        courtOrders[orderId] = CourtOrder({
            orderId: orderId,
            judgeAddress: msg.sender,
            userId: userId,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            reason: reason,
            isActive: true,
            wasAppealed: false,
            approvedBy: new address[](0)
        });
        
        userCourtOrders[userId].push(orderId);
        
        emit CourtOrderIssued(orderId, userId, msg.sender, expiresAt, reason);
        
        // Trigger off-chain notification (via subgraph/thegraph)
        emit UserNotified(userId, orderId, block.timestamp);
        
        return orderId;
    }
    
    /**
     * @dev Multi-sig approval for emergency access (3 of 5)
     */
    function approveCourtOrder(bytes32 orderId) external onlyAuthorizedJudge {
        CourtOrder storage order = courtOrders[orderId];
        require(order.issuedAt != 0, "Order not found");
        require(order.isActive, "Order not active");
        require(block.timestamp < order.expiresAt, "Order expired");
        
        // Check not already approved by this judge
        for (uint i = 0; i < order.approvedBy.length; i++) {
            require(order.approvedBy[i] != msg.sender, "Already approved");
        }
        
        order.approvedBy.push(msg.sender);
        
        emit MultiSigApproval(orderId, msg.sender);
    }
    
    /**
     * @dev Check if order has enough approvals
     */
    function hasEnoughApprovals(bytes32 orderId) public view returns (bool) {
        CourtOrder storage order = courtOrders[orderId];
        return order.approvedBy.length >= MIN_APPROVALS;
    }
    
    /**
     * @dev Verify token validity (called by API gateway)
     */
    function verifyToken(bytes32 orderId) public view returns (bool) {
        CourtOrder storage order = courtOrders[orderId];
        
        if (order.issuedAt == 0) return false;
        if (!order.isActive) return false;
        if (order.wasAppealed) return false;
        if (block.timestamp >= order.expiresAt) return false;
        
        // For emergency orders, require multi-sig
        if (order.approvedBy.length > 0 && !hasEnoughApprovals(orderId)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev User revokes access (veto power)
     * Must prove ownership of the user ID (off-chain verification)
     */
    function userRevokeAccess(bytes32 orderId, string calldata userProof) external {
        CourtOrder storage order = courtOrders[orderId];
        require(order.issuedAt != 0, "Order not found");
        
        // In production: verify userProof against off-chain identity
        // Here we simulate with a simple check
        require(bytes(userProof).length > 0, "Valid user proof required");
        
        order.isActive = false;
        order.wasAppealed = true;
        
        emit CourtOrderRevoked(orderId, msg.sender, "User appeal/veto");
        
        // Notify court off-chain
        emit UserNotified(order.userId, orderId, block.timestamp);
    }
    
    /**
     * @dev Grant access to a specific party (e.g., law enforcement)
     */
    function grantAccess(
        bytes32 orderId,
        address grantee,
        uint256 durationDays
    ) external returns (bool) {
        require(verifyToken(orderId), "Invalid or expired token");
        
        CourtOrder storage order = courtOrders[orderId];
        
        // Check if caller is authorized (judge or automated system)
        require(
            authorizedJudges[msg.sender] || msg.sender == order.judgeAddress,
            "Not authorized to grant"
        );
        
        uint256 grantExpires = block.timestamp + (durationDays * 1 days);
        if (grantExpires > order.expiresAt) {
            grantExpires = order.expiresAt; // Can't exceed order expiration
        }
        
        activeGrants[grantee] = AccessGrant({
            grantee: grantee,
            expiresAt: grantExpires,
            isRevoked: false,
            reason: order.reason
        });
        
        emit AccessGranted(grantee, order.userId, grantExpires);
        return true;
    }
    
    /**
     * @dev Revoke a specific grant
     */
    function revokeGrant(address grantee) external {
        AccessGrant storage grant = activeGrants[grantee];
        require(grant.grantee != address(0), "Grant not found");
        
        // Only owner or original grantee can revoke
        require(
            msg.sender == owner || msg.sender == grantee,
            "Not authorized"
        );
        
        grant.isRevoked = true;
        
        emit AccessRevoked(grantee, "Revoked by user/admin");
    }
    
    /**
     * @dev Get all court orders for a user
     */
    function getUserOrders(string calldata userId) external view returns (bytes32[] memory) {
        return userCourtOrders[userId];
    }
    
    /**
     * @dev Get court order details
     */
    function getCourtOrder(bytes32 orderId) external view returns (
        address judge,
        string memory userId,
        uint256 issuedAt,
        uint256 expiresAt,
        string memory reason,
        bool isActive,
        bool wasAppealed,
        uint256 approvalCount
    ) {
        CourtOrder storage order = courtOrders[orderId];
        return (
            order.judgeAddress,
            order.userId,
            order.issuedAt,
            order.expiresAt,
            order.reason,
            order.isActive,
            order.wasAppealed,
            order.approvedBy.length
        );
    }
    
    /**
     * @dev Check if an address has active grant
     */
    function hasActiveGrant(address addr) external view returns (bool) {
        AccessGrant storage grant = activeGrants[addr];
        if (grant.grantee == address(0)) return false;
        if (grant.isRevoked) return false;
        if (block.timestamp >= grant.expiresAt) return false;
        return true;
    }
}
